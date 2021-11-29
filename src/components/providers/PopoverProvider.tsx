import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ContextMenuEvent } from '../hooks/useContextMenu';
import { CellLocation, EditMode, Position } from '../types';
import { isWithinRect, isZeroPosition } from '../util';
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

const PopoverProvider: React.VFC<Props> = ({ root, mode, setMode, children }) => {
    const [contextMenuPosition, setContextMenuPosition] = useState<Position>();
    const [openedDropdown, setOpenedDropdown] = useState(false);
    const [location, setLocation] = useState<CellLocation>();

    const open = useMemo(() => {
        const openedContextMenu = !isZeroPosition(contextMenuPosition);
        return openedContextMenu || openedDropdown;
    }, [contextMenuPosition, openedDropdown]);

    /**
     * コンテキストメニューの表示
     */
    const openContextMenu = useCallback(
        (event: ContextMenuEvent<HTMLTableCellElement>, location: CellLocation) => {
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

            setLocation(location);
            setContextMenuPosition(pos);
        },
        [root]
    );

    const closeContextMenu = useCallback(() => {
        setContextMenuPosition(undefined);
    }, []);

    /**
     * 範囲選択モード時にテーブル範囲外がクリックされたら通常モードに戻す
     */
    const handleClickOutside = useCallback(
        (event: globalThis.MouseEvent) => {
            if (mode === 'select') {
                const { scrollX, scrollY } = window;
                const { left, top, width, height } = root;
                const { pageX, pageY } = event;

                const insideRoot = isWithinRect(
                    { left, top, width, height },
                    { pageX, pageY },
                    { scrollX, scrollY }
                );

                if (!insideRoot) {
                    setMode('normal');
                }
            }
        },
        [mode, root, setMode]
    );

    useEffect(() => {
        // 画面全体にクリックイベントの設定
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [handleClickOutside]);

    return (
        <PopoverContext.Provider
            value={{
                open,
                location,
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
