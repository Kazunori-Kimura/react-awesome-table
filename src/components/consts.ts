export enum MouseButton {
    Primary,
    Center,
    Second,
}

interface CellSizeDefinition {
    DefaultWidth: number;
    MinHeight: number;
}

export const CellSize: Readonly<CellSizeDefinition> = {
    DefaultWidth: 120,
    MinHeight: 32,
};

interface PopoverSizeDefinition {
    MaxWidth: number;
    MaxHeight: number;
}

export const Popover: Readonly<PopoverSizeDefinition> = {
    MaxHeight: 200,
    MaxWidth: 400,
};

export const TableCellRole = 'rat-table-cell';
