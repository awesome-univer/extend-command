/**
 * Copyright 2023-present DreamNum Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Dependency, IAccessor, ICellData, IMutationInfo, Nullable, Workbook } from '@univerjs/core';
import type { ISetRangeValuesMutationParams } from '@univerjs/sheets';
import type { IAutoFillLocation, ISheetAutoFillHook } from '@univerjs/sheets-ui';
import { Disposable, Inject, Injector, IUniverInstanceService, mergeOverrideWithDependencies, ObjectMatrix, Plugin, Range, Rectangle, registerDependencies, Tools, touchDependencies, UniverInstanceType } from '@univerjs/core';
import { SetRangeValuesMutation, SetRangeValuesUndoMutationFactory } from '@univerjs/sheets';
import { APPLY_TYPE, getAutoFillRepeatRange, IAutoFillService, virtualizeDiscreteRanges } from '@univerjs/sheets-ui';

export class UniverSheetsCellCustomAutoFillPlugin extends Plugin {
    static override pluginName = 'SHEET_CELL_CUSTOM_AUTO_FILL_PLUGIN';
    static override type = UniverInstanceType.UNIVER_SHEET;

    constructor(
        private readonly _config: undefined,
        @Inject(Injector) override readonly _injector: Injector
    ) {
        super();
    }

    override onStarting(): void {
        registerDependencies(this._injector, mergeOverrideWithDependencies([
            [CellCustomAutoFillController],
        ] as Dependency[]));

        touchDependencies(this._injector, [
            [CellCustomAutoFillController],
        ]);
    }
}

export class CellCustomAutoFillController extends Disposable {
    constructor(
        @Inject(Injector) private _injector: Injector,
        @IAutoFillService private readonly _autoFillService: IAutoFillService,
        @IUniverInstanceService private readonly _univerInstanceService: IUniverInstanceService
    ) {
        super();
        this._initAutoFillHook();
    }

    // register hook
    private _initAutoFillHook() {
        const hook: ISheetAutoFillHook = {
            id: 'CELL_CUSTOM_AUTO_FILL',
            priority: 0,
            onFillData: (location, direction, applyType) => {
                if (
                    applyType === APPLY_TYPE.COPY ||
                            applyType === APPLY_TYPE.ONLY_FORMAT ||
                            applyType === APPLY_TYPE.SERIES
                ) {
                    const { unitId, subUnitId } = location;

                    const unit = this._univerInstanceService.getUnit<Workbook>(unitId, UniverInstanceType.UNIVER_SHEET);
                    const worksheet = unit?.getSheetBySheetId(subUnitId);
                    const cellMatrix = worksheet?.getCellMatrix();

                    if (!cellMatrix) {
                        return noopReturnFunc();
                    }

                    return this._injector.invoke((accessor) => generalApplyFunc(location, cellMatrix, accessor));
                }

                return noopReturnFunc();
            },
        };

        this.disposeWithMe(
            this._autoFillService.addHook(hook)
        );
    }
}

function noopReturnFunc() {
    return { undos: [], redos: [] };
};

function generalApplyFunc(location: IAutoFillLocation, cellMatrix: ObjectMatrix<Nullable<ICellData>>, accessor: IAccessor) {
    const { source: sourceRange, target: targetRange, unitId, subUnitId } = location;

    const virtualRange = virtualizeDiscreteRanges([sourceRange, targetRange]);
    const [vSourceRange, vTargetRange] = virtualRange.ranges;
    const { mapFunc } = virtualRange;
    const sourceStartCell = {
        row: vSourceRange.startRow,
        col: vSourceRange.startColumn,
    };

    const valueMatrix = new ObjectMatrix<ICellData>();

    const repeats = getAutoFillRepeatRange(vSourceRange, vTargetRange);
    repeats.forEach((repeat) => {
        const targetStartCell = repeat.repeatStartCell;
        const relativeRange = repeat.relativeRange;
        const sourceRange = {
            startRow: sourceStartCell.row,
            startColumn: sourceStartCell.col,
            endColumn: sourceStartCell.col,
            endRow: sourceStartCell.row,
        };
        const targetRange = {
            startRow: targetStartCell.row,
            startColumn: targetStartCell.col,
            endColumn: targetStartCell.col,
            endRow: targetStartCell.row,
        };
        Range.foreach(relativeRange, (row, col) => {
            const sourcePositionRange = Rectangle.getPositionRange(
                {
                    startRow: row,
                    startColumn: col,
                    endColumn: col,
                    endRow: row,
                },
                sourceRange
            );
            const { row: sourceRow, col: sourceCol } = mapFunc(sourcePositionRange.startRow, sourcePositionRange.startColumn);

            const targetPositionRange = Rectangle.getPositionRange(
                {
                    startRow: row,
                    startColumn: col,
                    endColumn: col,
                    endRow: row,
                },
                targetRange
            );
            const { row: targetRow, col: targetCol } = mapFunc(targetPositionRange.startRow, targetPositionRange.startColumn);

            const cellData = cellMatrix.getValue(sourceRow, sourceCol);
            if (cellData?.custom) {
                valueMatrix.setValue(targetRow, targetCol, Tools.deepClone({ custom: cellData.custom }));
            }
        });
    });

    const redoMutationsInfo: IMutationInfo[] = [];
    const undoMutationsInfo: IMutationInfo[] = [];

    if (valueMatrix.getLength() > 0) {
        const setCustomMutation: ISetRangeValuesMutationParams = {
            unitId,
            subUnitId,
            cellValue: valueMatrix.getMatrix(),
        };

        redoMutationsInfo.push({
            id: SetRangeValuesMutation.id,
            params: setCustomMutation,
        });

        // undo
        const undoSetValuesMutation: ISetRangeValuesMutationParams = SetRangeValuesUndoMutationFactory(
            accessor,
            setCustomMutation
        );

        undoMutationsInfo.push({
            id: SetRangeValuesMutation.id,
            params: undoSetValuesMutation,
        });
    }

    return {
        undos: undoMutationsInfo,
        redos: redoMutationsInfo,
    };
};
