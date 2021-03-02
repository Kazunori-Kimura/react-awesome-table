import {
    Cell,
    CellLocation,
    ColumnDefinition,
    DataListType,
    ValidatorFunction,
    ValidatorResult,
} from './types';

// 必須チェック
const requiredValidator = (value: string): ValidatorResult => {
    if (value.length === 0) {
        return [false, '必須項目です'];
    }
    return [true];
};

// 数値チェック
const numericValidator = (value: string): ValidatorResult => {
    const v = parseFloat(value);
    if (isNaN(v) || v.toString() !== value) {
        return [false, '数値で入力してください'];
    }
    return [true];
};

// リストチェック
const listValidator = (value: string, list: DataListType): ValidatorResult => {
    const values = list.map((item) => item.value);
    const names = list.map((item) => item.name);
    if (!values.includes(value)) {
        return [false, `${names.join(',')}のいずれかを指定してください`];
    }
    return [true];
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
    cells: Cell<T>[][]
): ValidatorResult {
    let isValid = true;
    const messages: string[] = [];
    const { validator, valueType, required, dataList, isPermittedExceptList } = column;

    // 数値の場合
    if (valueType === 'numeric' && value.length > 0) {
        const [valid, message] = numericValidator(value);
        isValid = isValid && valid;
        if (message) {
            messages.push(message);
        }
    }

    // 必須チェック
    if (required) {
        const [valid, message] = requiredValidator(value);
        isValid = isValid && valid;
        if (message) {
            messages.push(message);
        }
    }

    // リストチェック
    if (dataList && !isPermittedExceptList && value.length > 0) {
        const [valid, message] = listValidator(value, dataList);
        isValid = isValid && valid;
        if (message) {
            messages.push(message);
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
                messages.push(message);
            }
        });
    }

    const message: string | undefined = messages.length > 0 ? messages.join('\n') : undefined;
    return [isValid, message];
}
