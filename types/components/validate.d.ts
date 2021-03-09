import { MessageDefinitions } from './messages';
import { Cell, CellLocation, ColumnDefinition, ValidatorResult } from './types';
/**
 * セルの入力値チェック
 * @param column
 * @param value
 * @param location
 * @param cells
 */
export declare function validateCell<T>(column: ColumnDefinition<T>, value: string, location: CellLocation, cells: Cell<T>[][], messages?: MessageDefinitions): ValidatorResult;
