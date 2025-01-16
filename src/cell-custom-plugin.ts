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

import type { Dependency, IAccessor, ICellData, IMutationInfo, Nullable } from '@univerjs/core';
import type { ISetRangeValuesMutationParams } from '@univerjs/sheets';
import type { ICellDataWithSpanInfo, ISheetDiscreteRangeLocation } from '@univerjs/sheets-ui';
import { Disposable, Inject, Injector, mergeOverrideWithDependencies, ObjectMatrix, Plugin, registerDependencies, Tools, touchDependencies, UniverInstanceType } from '@univerjs/core';
import { SetRangeValuesMutation, SetRangeValuesUndoMutationFactory } from '@univerjs/sheets';
import { ISheetClipboardService, virtualizeDiscreteRanges } from '@univerjs/sheets-ui';

export class UniverSheetsClipboardCellCustomPlugin extends Plugin {
    static override pluginName = 'SHEET_CLIPBOARD_CELL_CUSTOM_PLUGIN';
    static override type = UniverInstanceType.UNIVER_SHEET;

    constructor(
        private readonly _config: undefined,
        @Inject(Injector) override readonly _injector: Injector
    ) {
        super();
    }

    override onStarting(): void {
        registerDependencies(this._injector, mergeOverrideWithDependencies([
            [CellCustomCopyPasteController],
        ] as Dependency[]));

        touchDependencies(this._injector, [
            [CellCustomCopyPasteController],
        ]);
    }
}

export class CellCustomCopyPasteController extends Disposable {
    constructor(
        @Inject(Injector) private _injector: Injector,
        @Inject(ISheetClipboardService) private _sheetClipboardService: ISheetClipboardService
    ) {
        super();
        this._initClipboardHook();
    }

    // register hook
    private _initClipboardHook() {
        this.disposeWithMe(
            this._sheetClipboardService.addClipboardHook({
                id: 'special-paste-cell-custom',
                priority: 0,
                onPasteCells: (pasteFrom, pasteTo, data) => {
                    return this._injector.invoke((accessor) => getSetCellCustomMutations(pasteTo, pasteFrom, data, accessor));
                },
            })
        );
    }
}

/**
 *
 * @param pasteTo
 * @param pasteFrom
 * @param matrix
 * @param accessor
 */
export function getSetCellCustomMutations(
    pasteTo: ISheetDiscreteRangeLocation,
    pasteFrom: Nullable<ISheetDiscreteRangeLocation>,
    matrix: ObjectMatrix<ICellDataWithSpanInfo>,
    accessor: IAccessor
) {
    const { unitId, subUnitId, range } = pasteTo;
    const redoMutationsInfo: IMutationInfo[] = [];
    const undoMutationsInfo: IMutationInfo[] = [];
    const { mapFunc } = virtualizeDiscreteRanges([range]);
    const valueMatrix = new ObjectMatrix<ICellData>();

    matrix.forValue((row, col, value) => {
        const { row: realRow, col: realCol } = mapFunc(row, col);

        if (value.custom) {
            valueMatrix.setValue(realRow, realCol, Tools.deepClone({ custom: value.custom }));
        }
    });

    const setCustomMutation: ISetRangeValuesMutationParams = {
        unitId,
        subUnitId,
        cellValue: Tools.deepClone(valueMatrix.getMatrix()),
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
    return {
        undos: undoMutationsInfo,
        redos: redoMutationsInfo,
    };
}
