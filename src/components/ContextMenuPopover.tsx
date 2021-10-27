import { makeStyles } from '@material-ui/styles';
import classnames from 'classnames';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Popover } from './consts';
import { formatMessage, MessageContext } from './providers/MessageProvider';
import { PopoverContext } from './providers/PopoverProvider';
import { Position } from './types';
import { isWithinRect, isZeroPosition } from './util';

interface Props {
    getSelectedCellValus: () => string;
    pasteData: (text: string) => void;
    onClose: VoidFunction;
}

interface StyleProps {
    position: Position;
}

const useStyles = makeStyles({
    root: ({ position }: StyleProps) => ({
        boxShadow: '0px 0px 5px 3px rgba(10,10,10,0.2)',
        width: 'max-content',
        maxWidth: Popover.MaxWidth,
        boxSizing: 'border-box',
        zIndex: 10,
        backgroundColor: '#fff',
        display: isZeroPosition(position) ? 'none' : 'flex',
        flexDirection: 'column',
        outline: 0,
        // 位置
        position: 'absolute',
        ...position,
    }),
    container: {
        boxSizing: 'border-box',
        minHeight: '0.5rem',
        maxHeight: Popover.MaxHeight,
        overflowY: 'auto',
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
    },
    item: {
        padding: '0.3rem',
        width: '100%',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textAlign: 'left',
        textOverflow: 'ellipsis',
        backgroundColor: '#fff',
        border: '1px solid #fff',
        outline: 0,
        // テキストを選択状態にしない
        userSelect: 'none',
        '-webkit-user-select': 'none',
        '-webkit-touch-callout': 'none',
    },
    active: {
        backgroundColor: '#eee',
        borderTop: '1px solid #ccc',
        borderBottom: '1px solid #ccc',
    },
});

type MenuItem = 'copy' | 'paste' | 'select';

/**
 * 右クリックメニュー
 */
const ContextMenuPopover: React.VFC<Props> = ({ getSelectedCellValus, pasteData, onClose }) => {
    const { contextMenuPosition, closeContextMenu } = useContext(PopoverContext);
    const classes = useStyles({ position: contextMenuPosition });
    const ref = useRef<HTMLDivElement>();
    const messages = useContext(MessageContext);
    const [active, setActive] = useState<MenuItem>();

    /**
     * 右クリックメニューを閉じる
     */
    const handleClose = useCallback(() => {
        closeContextMenu();
        onClose();
    }, [closeContextMenu, onClose]);

    /**
     * コピー
     */
    const handleClickCopy = useCallback(async () => {
        if (navigator.clipboard) {
            const text = getSelectedCellValus();
            await navigator.clipboard.writeText(text);
        }
        handleClose();
    }, [getSelectedCellValus, handleClose]);

    /**
     * ペースト
     */
    const handleClickPaste = useCallback(async () => {
        if (navigator.clipboard) {
            const text = await navigator.clipboard.readText();
            if (text !== '') {
                pasteData(text);
            }
        }
        handleClose();
    }, [handleClose, pasteData]);

    /**
     * リストの外側をクリックされたら閉じる
     */
    const handleClickOutside = useCallback(
        (event: globalThis.MouseEvent) => {
            if (ref.current) {
                const { scrollX, scrollY } = window;
                const { left, top, width, height } = ref.current.getBoundingClientRect();
                const { pageX, pageY } = event;

                const insideSelf = isWithinRect(
                    { left, top, width, height },
                    { pageX, pageY },
                    { scrollX, scrollY }
                );

                if (!insideSelf) {
                    // 閉じる
                    handleClose();
                }
            }
        },
        [handleClose]
    );

    useEffect(() => {
        // 画面全体にクリックイベントの設定
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [handleClickOutside]);

    return (
        <>
            {!isZeroPosition(contextMenuPosition) && (
                <div className={classes.root} ref={ref}>
                    <div className={classes.container}>
                        {/* コピー */}
                        <button
                            className={classnames(classes.item, {
                                [classes.active]: active === 'copy',
                            })}
                            onClick={handleClickCopy}
                            onMouseOver={() => setActive('copy')}
                        >
                            {formatMessage(messages, 'copy')}
                        </button>
                        {/* 貼り付け */}
                        <button
                            className={classnames(classes.item, {
                                [classes.active]: active === 'paste',
                            })}
                            onClick={handleClickPaste}
                            onMouseOver={() => setActive('paste')}
                        >
                            {formatMessage(messages, 'paste')}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ContextMenuPopover;
