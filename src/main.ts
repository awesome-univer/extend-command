import "./style.css";

import { LocaleType, Univer, UniverInstanceType } from "@univerjs/core";
import { defaultTheme } from "@univerjs/design";
import { UniverDocsPlugin } from "@univerjs/docs";
import { UniverDocsUIPlugin } from "@univerjs/docs-ui";
import { UniverFormulaEnginePlugin } from "@univerjs/engine-formula";
import { UniverRenderEnginePlugin } from "@univerjs/engine-render";
import { UniverSheetsPlugin } from "@univerjs/sheets";
import { UniverSheetsFormulaPlugin } from "@univerjs/sheets-formula";
import { UniverSheetsFormulaUIPlugin } from "@univerjs/sheets-formula-ui";
import { UniverSheetsUIPlugin } from "@univerjs/sheets-ui";
import { UniverUIPlugin } from "@univerjs/ui";
import { UniverSheetsNumfmtPlugin } from "@univerjs/sheets-numfmt";
import { FUniver } from "@univerjs/facade";

import '@univerjs/sheets/facade';
import '@univerjs/ui/facade';
import '@univerjs/docs-ui/facade';
import '@univerjs/sheets-ui/facade';
import '@univerjs/engine-formula/facade';
import '@univerjs/sheets-formula/facade';
import '@univerjs/sheets-numfmt/facade';
/**
 * The ability to import locales from virtual modules and automatically import styles is provided by Univer Plugins. For more details, please refer to: https://univer.ai/guides/sheet/advanced/univer-plugins.
 * If you encounter issues while using the plugin or have difficulty understanding how to use it, please disable Univer Plugins and manually import the language packs and styles.
 * 
 * 【从虚拟模块导入语言包】以及【自动导入样式】是由 Univer Plugins 提供的能力，详情参考：https://univer.ai/zh-CN/guides/sheet/advanced/univer-plugins
 * 如果您在使用该插件的时候出现了问题，或者无法理解如何使用，请禁用 Univer Plugins，并手动导入语言包和样式
 */
import { zhCN, enUS } from 'univer:locales'
import { UniverSheetsCellCustomPastePlugin } from "./cell-custom-paste-plugin";
import { UniverSheetsCellCustomAutoFillPlugin } from "./cell-custom-auto-fill-plugin";

const univer = new Univer({
  theme: defaultTheme,
  locale: LocaleType.EN_US,
  locales: {
    [LocaleType.ZH_CN]: zhCN,
    [LocaleType.EN_US]: enUS,
  },
});

univer.registerPlugin(UniverRenderEnginePlugin);
univer.registerPlugin(UniverFormulaEnginePlugin);

univer.registerPlugin(UniverUIPlugin, {
  container: 'app',
});

univer.registerPlugin(UniverDocsPlugin, {
  hasScroll: false,
});
univer.registerPlugin(UniverDocsUIPlugin);

univer.registerPlugin(UniverSheetsPlugin);
univer.registerPlugin(UniverSheetsUIPlugin);
univer.registerPlugin(UniverSheetsNumfmtPlugin);
univer.registerPlugin(UniverSheetsFormulaPlugin);
univer.registerPlugin(UniverSheetsFormulaUIPlugin);
univer.registerPlugin(UniverSheetsCellCustomPastePlugin);
univer.registerPlugin(UniverSheetsCellCustomAutoFillPlugin);

// create univer sheet instance
univer.createUnit(UniverInstanceType.UNIVER_SHEET, {
    id: 'workbook',
    sheets:{
        'sheet1':{
            id: 'sheet1',
            name: 'Sheet1',
            cellData:{
                0:{
                    0:{
                      v: 'Hello1, Univer',
                      custom: {
                          key: 'v1',
                      },
                    },
                    1:{
                      v: 'Hello2, Univer',
                      custom: {
                          key: 'v2',
                      },
                    },
                },
                1:{
                    0:{
                      v: 'Hello3, Univer',
                      custom: {
                          key: 'v3',
                      },
                    },
                    1:{
                      v: 'Hello4, Univer',
                      custom: {
                          key: 'v4',
                      },
                    },
                }
            }
        }
    }
});

window.univerAPI = FUniver.newAPI(univer);

declare global {
    interface Window {
        univerAPI?: ReturnType<typeof FUniver.newAPI>;
    }
}
