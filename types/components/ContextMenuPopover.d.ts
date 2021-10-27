import React from 'react';
interface Props {
    getSelectedCellValus: () => string;
    pasteData: (text: string) => void;
    onClose: VoidFunction;
}
/**
 * 右クリックメニュー
 */
declare const ContextMenuPopover: React.VFC<Props>;
export default ContextMenuPopover;
