import React from 'react';
import { Position } from '../types';
import { ContextMenuEvent } from '../useContextMenu';
import { ProviderProps } from './types';
interface Props extends ProviderProps {
    root?: DOMRect;
}
interface IPopoverContext {
    /**
     * 何某かのポップアップが開いている
     */
    open: boolean;
    /**
     * 右クリックメニューの表示位置
     */
    contextMenuPosition?: Position;
    /**
     * ドロップダウンリストが開いている
     */
    openedDropdown: boolean;
    setOpenedDropdown: (open: boolean) => void;
    /**
     * 右クリックメニューの表示
     */
    openContextMenu: (event: ContextMenuEvent) => void;
    /**
     * 右クリックメニューを閉じる
     */
    closeContextMenu: VoidFunction;
}
export declare const PopoverContext: React.Context<IPopoverContext>;
declare const PopoverProvider: React.VFC<Props>;
export default PopoverProvider;
