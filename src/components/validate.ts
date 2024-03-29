import { defaultMessages, formatMessage, MessageDefinitions } from './providers/MessageProvider';
import {
    Cell,
    CellLocation,
    ColumnDefinition,
    DataListType,
    ValidatorFunction,
    ValidatorResult,
} from './types';

// 必須チェック
const requiredValidator = (value: string, messages: MessageDefinitions): ValidatorResult => {
    if (value.length === 0) {
        return [false, formatMessage(messages, 'validate.required')];
    }
    return [true];
};

// 数値チェック
const numericValidator = (value: string, messages: MessageDefinitions): ValidatorResult => {
    const v = parseFloat(value);
    if (isNaN(v) || v.toString() !== value) {
        return [false, formatMessage(messages, 'validate.numeric')];
    }
    return [true];
};

// リストチェック
const listValidator = (
    value: string,
    list: DataListType,
    messages: MessageDefinitions
): ValidatorResult => {
    const values = list.map((item) => item.value);
    const names = list.map((item) => item.name);
    if (!values.includes(value)) {
        return [false, formatMessage(messages, 'validate.datalist', { list: names.join(',') })];
    }
    return [true];
};

// 重複チェック
const uniqueValidator = <T>(
    value: string,
    location: CellLocation,
    cells: Cell<T>[][],
    messages: MessageDefinitions
): ValidatorResult => {
    let valid = true;

    cells.forEach((row, index) => {
        if (location.row !== index) {
            valid = valid && row[location.column].value !== value;
        }
    });

    return [valid, !valid ? formatMessage(messages, 'validate.unique') : undefined];
};

/**
 * セルの入力値チェック
 * @param column
 * @param value
 * @param location
 * @param cells
 */
export function validateCell<T>(
    column: ColumnDefinition<T>,
    value: string,
    location: CellLocation,
    cells: Cell<T>[][],
    messages: MessageDefinitions = defaultMessages
): ValidatorResult {
    let isValid = true;
    const invalidMessages: string[] = [];
    const { validator, valueType, required, dataList, isPermittedExceptList, unique } = column;

    // 数値の場合
    if (valueType === 'numeric' && value.length > 0) {
        const [valid, message] = numericValidator(value, messages);
        isValid = isValid && valid;
        if (message) {
            invalidMessages.push(message);
        }
    }

    // 必須チェック
    if (required) {
        const [valid, message] = requiredValidator(value, messages);
        isValid = isValid && valid;
        if (message) {
            invalidMessages.push(message);
        }
    }

    // リストチェック
    if (dataList && !isPermittedExceptList && value.length > 0) {
        const [valid, message] = listValidator(value, dataList, messages);
        isValid = isValid && valid;
        if (message) {
            invalidMessages.push(message);
        }
    }

    // 重複チェック
    if (unique && value.length > 0) {
        const [valid, message] = uniqueValidator(value, location, cells, messages);
        isValid = isValid && valid;
        if (message) {
            invalidMessages.push(message);
        }
    }

    // 任意の入力チェック
    if (validator) {
        const validators: ValidatorFunction<T>[] = [];
        if (Array.isArray(validator)) {
            validators.push(...validator);
        } else {
            validators.push(validator);
        }

        validators.forEach((v) => {
            const [valid, message] = v(value, location, cells);
            isValid = isValid && valid;
            if (message) {
                invalidMessages.push(message);
            }
        });
    }

    const message: string | undefined =
        invalidMessages.length > 0 ? invalidMessages.join('\n') : undefined;
    return [isValid, message];
}
