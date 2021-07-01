import { makeStyles } from '@material-ui/styles';
import classnames from 'classnames';
import React, {
    ChangeEvent,
    KeyboardEvent,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Popover } from './consts';
import { CellLocation, DataListType, EditorProps } from './types';
import { debug, isWithinRect } from './util';

interface DropdownListPopoverProps extends EditorProps {
    location: CellLocation;
    position: StyleProps;
    items: DataListType;
    parent?: DOMRect;
}

export interface StyleProps {
    minWidth?: number;
    top?: number;
    bottom?: number;
    left?: number | string;
    right?: number | string;
}

const useStyles = makeStyles({
    root: (props: StyleProps) => ({
        boxShadow: '0px 0px 5px 3px rgba(10,10,10,0.2)',
        width: 'max-content',
        maxWidth: Popover.MaxWidth,
        boxSizing: 'border-box',
        zIndex: 10,
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        outline: 0,
        // 位置
        position: 'absolute',
        ...props,
    }),
    filter: {
        display: 'flex',
        padding: 3,
    },
    filterInput: {
        flex: 1,
    },
    filterClear: {
        marginRight: -4,
        backgroundColor: 'inherit',
        border: 'none',
        outline: 0,
        '&:focus': {
            border: 'none',
            boxShadow: 'none',
            outline: 0,
        },
    },
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
    },
    active: {
        backgroundColor: '#eee',
        borderTop: '1px solid #ccc',
        borderBottom: '1px solid #ccc',
    },
});

const DropdownListPopover: React.FC<DropdownListPopoverProps> = ({
    location,
    parent,
    position,
    value,
    items,
    commit,
    cancel,
}) => {
    const classes = useStyles(position);
    const ref = useRef<HTMLDivElement>();
    const inputRef = useRef<HTMLInputElement>(null);

    const [activeIndex, setActive] = useState(-1);
    // フィルタ
    const [filter, setFilter] = useState('');

    // フィルタされた項目
    const filteredItems = useMemo(() => {
        if (filter === '') {
            return items;
        }
        return items.filter(({ name }) => name.includes(filter));
    }, [filter, items]);

    /**
     * 値の更新 / 更新のキャンセル
     */
    const triggerChange = useCallback(
        (selectedValue?: string) => {
            if (typeof selectedValue === 'string' && value !== selectedValue) {
                // 更新の確定
                commit(selectedValue);
                return;
            }

            // 更新をキャンセル
            cancel();
        },
        [cancel, commit, value]
    );

    /**
     * 項目をクリック
     * @param index
     */
    const handleClick = useCallback(
        (index: number): VoidFunction => {
            const item = filteredItems[index];
            return () => {
                triggerChange(item.value);
            };
        },
        [filteredItems, triggerChange]
    );

    /**
     * 前の要素を選択
     */
    const navigatePrev = useCallback(() => {
        setActive((current) => {
            if (current === 0) {
                return 0;
            }
            return current - 1;
        });
    }, []);

    /**
     * 次の要素を選択
     */
    const navigateNext = useCallback(() => {
        setActive((current) => {
            if (current === filteredItems.length - 1) {
                return current;
            }
            return current + 1;
        });
    }, [filteredItems.length]);

    /**
     * キーボード操作
     * @param event
     */
    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLInputElement>) => {
            const { key, shiftKey } = event;
            let isPreventDefault = false;
            debug(`onKeyDown: ${shiftKey ? 'Shift+' : ''}${key}`);

            // ArrowUp, ArrowDown, Tab で選択
            // Space, Enter で確定
            // Escape でキャンセル
            switch (key) {
                case 'ArrowUp':
                    navigatePrev();
                    isPreventDefault = true;
                    break;
                case 'ArrowDown':
                    navigateNext();
                    isPreventDefault = true;
                    break;
                case 'Tab':
                    if (shiftKey) {
                        // Shift+Tab
                        navigatePrev();
                    } else {
                        // Tab
                        navigateNext();
                    }
                    isPreventDefault = true;
                    break;
                case ' ':
                    if (activeIndex >= 0) {
                        triggerChange(filteredItems[activeIndex].value);
                        isPreventDefault = true;
                    }
                    break;
                case 'Enter':
                    if (activeIndex >= 0) {
                        triggerChange(filteredItems[activeIndex].value);
                        isPreventDefault = true;
                    }
                    break;
                case 'Escape':
                    triggerChange();
                    isPreventDefault = true;
                    break;
                case 'Esc':
                    triggerChange();
                    isPreventDefault = true;
                    break;
            }

            if (isPreventDefault) {
                event.preventDefault();
            }
        },
        [activeIndex, filteredItems, navigateNext, navigatePrev, triggerChange]
    );

    /**
     * フィルタの入力
     */
    const handleChangeFilter = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setFilter(value);
        // アクティブな項目をクリア
        setActive(-1);
    }, []);

    /**
     * フィルタのクリア
     */
    const handleClickClear = useCallback(() => {
        if (inputRef.current) {
            setFilter('');
            // アクティブな項目をクリア
            setActive(-1);
            // フォーカスをフィルタに戻す
            inputRef.current.focus();
        }
    }, []);

    /**
     * リストの外側をクリックされたら編集をキャンセルする
     */
    const handleClickOutside = useCallback(
        (event: globalThis.MouseEvent) => {
            if (ref.current && parent) {
                const { scrollX, scrollY } = window;
                const { left, top, width, height } = ref.current.getBoundingClientRect();
                const { pageX, pageY } = event;

                const insideSelf = isWithinRect(
                    { left, top, width, height },
                    { pageX, pageY },
                    { scrollX, scrollY }
                );
                const insideParent = isWithinRect(parent, { pageX, pageY }, { scrollX, scrollY });

                if (!(insideSelf || insideParent)) {
                    // 編集をキャンセル
                    triggerChange();
                }
            }
        },
        [parent, triggerChange]
    );

    useEffect(() => {
        // 画面全体にクリックイベントの設定
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [handleClickOutside]);

    // 描画完了時にフィルタにフォーカスをセットする
    useLayoutEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    return (
        <div className={classes.root} ref={ref} tabIndex={0}>
            {/* フィルタ */}
            <div className={classes.filter}>
                <input
                    type="text"
                    ref={inputRef}
                    className={classes.filterInput}
                    name="filter"
                    value={filter}
                    onChange={handleChangeFilter}
                    onKeyDown={handleKeyDown}
                />
                <button className={classes.filterClear} onClick={handleClickClear}>
                    &times;
                </button>
            </div>
            <div className={classes.container}>
                {/* リスト */}
                <div className={classes.list}>
                    {filteredItems.map((item, index) => {
                        const key = `${location.row}_${location.column}_${item.value}`;
                        return (
                            <button
                                key={key}
                                className={classnames(classes.item, {
                                    [classes.active]: activeIndex === index,
                                })}
                                onMouseOver={() => setActive(index)}
                                onClick={handleClick(index)}
                            >
                                {item.name}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default DropdownListPopover;
