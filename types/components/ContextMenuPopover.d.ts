import React from 'react';
import { Position } from './types';
interface Props {
    open?: boolean;
    position?: Position;
    getSelectedCellValus: () => string;
    pasteData: (text: string) => void;
    onClose: VoidFunction;
}
/**
 * 右クリックメニュー
 */
declare const ContextMenuPopover: React.VFC<Props>;
export default ContextMenuPopover;
