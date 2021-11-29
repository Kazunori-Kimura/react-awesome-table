import React from 'react';
import { ContextMenuEvent } from '../hooks/useContextMenu';
import { CellLocation, EditMode, Position } from '../types';
import { ProviderProps } from './types';
interface Props extends ProviderProps {
    root?: DOMRect;
    mode: EditMode;
    setMode: (mode: EditMode) => void;
}
interface IPopoverContext {
    /**
     * 何某かのポップアップが開いている
     */
    open: boolean;
    /**
     * 右クリックされたセルの位置
     */
    location?: CellLocation;
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
    openContextMenu: (event: ContextMenuEvent, location: CellLocation) => void;
    /**
     * 右クリックメニューを閉じる
     */
    closeContextMenu: VoidFunction;
}
export declare const PopoverContext: React.Context<IPopoverContext>;
declare const PopoverProvider: React.VFC<Props>;
export default PopoverProvider;
