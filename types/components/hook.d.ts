import { TableHookParameters, TableHookReturns } from './types';
/**
 * Table の props を生成するカスタム Hooks
 */
export declare const useTable: <T>({ items, columns, getRowKey, onChange, page, rowsPerPage, rowsPerPageOptions, options, messages, readOnly, disableUndo, }: TableHookParameters<T>) => TableHookReturns<T>;
