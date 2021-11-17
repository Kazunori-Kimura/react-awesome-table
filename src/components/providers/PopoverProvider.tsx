import React, { useCallback, useMemo, useState } from 'react';
import { ContextMenuEvent } from '../hooks/useContextMenu';
import { Position } from '../types';
import { isZeroPosition } from '../util';
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

const dummy = () => {
    // dummy
};

const defaultContextValue: IPopoverContext = {
    open: false,
    openedDropdown: false,
    setOpenedDropdown: dummy,
    openContextMenu: dummy,
    closeContextMenu: dummy,
};

export const PopoverContext = React.createContext<IPopoverContext>(defaultContextValue);

const PopoverProvider: React.VFC<Props> = ({ root, children }) => {
    const [contextMenuPosition, setContextMenuPosition] = useState<Position>();
    const [openedDropdown, setOpenedDropdown] = useState(false);

    const open = useMemo(() => {
        const openedContextMenu = !isZeroPosition(contextMenuPosition);
        return openedContextMenu || openedDropdown;
    }, [contextMenuPosition, openedDropdown]);

    /**
     * コンテキストメニューの表示
     */
    const openContextMenu = useCallback(
        (event: ContextMenuEvent<HTMLTableCellElement>) => {
            event.preventDefault();
            const pos: Position = {
                top: 0,
                left: 0,
            };

            if (root) {
                const { x, y } = root;
                pos.top -= y;
                pos.left -= x;
            }

            if ('changedTouches' in event) {
                const { pageX, pageY } = event.changedTouches[0];
                pos.top += pageY;
                pos.left += pageX;
            } else {
                const { clientX, clientY } = event;
                pos.top += clientY;
                pos.left += clientX;
            }

            setContextMenuPosition(pos);
        },
        [root]
    );

    const closeContextMenu = useCallback(() => {
        setContextMenuPosition(undefined);
    }, []);

    return (
        <PopoverContext.Provider
            value={{
                open,
                contextMenuPosition,
                openedDropdown,
                setOpenedDropdown,
                openContextMenu,
                closeContextMenu,
            }}
        >
            {children}
        </PopoverContext.Provider>
    );
};

export default PopoverProvider;
