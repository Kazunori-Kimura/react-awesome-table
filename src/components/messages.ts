import React from 'react';

export type MessageFunction = (params: Record<string, string>) => string;

export const defaultMessages = {
    // header
    addRow: '追加',
    deleteRows: '削除',
    // hook
    deleteConfirm: ({ count }: { count: string }): string =>
        `${count}件 のデータを削除します。よろしいですか？`,
    // pagination
    'pagination.first': '<<',
    'pagination.prev': '<',
    'pagination.next': '>',
    'pagination.last': '>>',
    // sort
    asc: '昇順',
    desc: '降順',
    // validate
    'validate.required': '必須項目です',
    'validate.numeric': '数値で入力してください',
    'validate.datalist': ({ list }: { list: string }): string =>
        `${list}のいずれかを指定してください`,
};

export type MessageDefinitions = Partial<
    Record<keyof typeof defaultMessages, string | MessageFunction>
>;

export const MessageContext = React.createContext<MessageDefinitions>(defaultMessages);

/**
 * メッセージ変換
 * @param messages
 * @param key
 * @param params
 * @returns
 */
export const formatMessage = (
    messages: MessageDefinitions,
    key: keyof MessageDefinitions,
    params: Record<string, string> = {}
): string => {
    const value = messages[key];
    if (typeof value === 'string') {
        return value;
    } else {
        return value(params);
    }
};
