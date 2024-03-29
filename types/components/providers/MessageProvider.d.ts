import React from 'react';
import { ProviderProps } from './types';
export declare type MessageFunction = (params: Record<string, string>) => string;
export declare const defaultMessages: {
    addRow: string;
    deleteRows: string;
    deleteConfirm: ({ count }: {
        count: string;
    }) => string;
    'pagination.first': string;
    'pagination.prev': string;
    'pagination.next': string;
    'pagination.last': string;
    asc: string;
    desc: string;
    filter: string;
    'validate.required': string;
    'validate.numeric': string;
    'validate.datalist': ({ list }: {
        list: string;
    }) => string;
    'validate.unique': string;
    copy: string;
    paste: string;
    select: string;
};
export declare type MessageDefinitions = Partial<Record<keyof typeof defaultMessages, string | MessageFunction>>;
export declare const MessageContext: React.Context<Partial<Record<"filter" | "copy" | "select" | "desc" | "paste" | "addRow" | "deleteRows" | "deleteConfirm" | "pagination.first" | "pagination.prev" | "pagination.next" | "pagination.last" | "asc" | "validate.required" | "validate.numeric" | "validate.datalist" | "validate.unique", string | MessageFunction>>>;
/**
 * メッセージ変換
 * @param messages
 * @param key
 * @param params
 * @returns
 */
export declare const formatMessage: (messages: MessageDefinitions, key: keyof MessageDefinitions, params?: Record<string, string>) => string;
interface Props extends ProviderProps {
    messages: MessageDefinitions;
}
declare const MessageProvider: React.VFC<Props>;
export default MessageProvider;
