import { makeStyles } from '@material-ui/styles';
import { Meta, Story } from '@storybook/react/types-6-0';
import React, { MouseEvent, useState } from 'react';
import SortButton from '../../src/components/SortButton';
import Table from '../../src/components/Table';
import {
    Cell,
    CellRenderProps,
    ColumnDefinition,
    ColumnHeaderProps,
    HeaderProps,
    PaginationProps,
    TableProps,
} from '../../src/components/types';
import ForwardSample from './examples/ForwardSample';
import UpdateDataSample from './examples/UpdateData';

export default {
    title: 'components/Table',
    component: Table,
    argTypes: {
        readOnly: {
            control: 'boolean',
        },
        sticky: {
            control: 'boolean',
        },
        rowNumber: {
            control: 'boolean',
        },
    },
} as Meta;

// ランダムな数値を取得
const random = (): number => {
    return Math.floor(Math.random() * 1000) / 100;
};

// ====== 最も単純なサンプル ======

// 定義
interface Point2D {
    name: string;
    x: number;
    y: number;
    color?: string;
}

// 1000件生成
const data: Point2D[] = [...Array(999)].map((_, index) => {
    const name = index === 0 ? '' : `point_${index + 1}`;
    return {
        name,
        x: random(),
        y: random(),
        color: 'red',
    };
});

// 列定義
const columns: ColumnDefinition<Point2D>[] = [
    {
        name: 'name',
        getValue: (item) => item.name,
        defaultValue: (row: number) => `point_${row + 1}`,
        required: true,
        unique: true,
        width: 180,
    },
    {
        name: 'x',
        getValue: (item) => `${item.x ?? ''}`,
        valueType: 'numeric',
        width: 100,
        required: true,
    },
    {
        name: 'y',
        getValue: (item) => `${item.y ?? ''}`,
        valueType: 'numeric',
        width: 100,
        defaultValue: '0',
    },
    {
        name: 'color',
        getValue: (item) => item.color ?? '',
        valueType: 'string',
        width: 100,
        dataList: [
            { name: '', value: '' },
            { name: 'red', value: 'red' },
            { name: 'green', value: 'green' },
            { name: 'blue', value: 'blue' },
        ],
    },
];

// キーの生成
const getRowKey = (item: Point2D | undefined, rowIndex: number): string => {
    if (item) {
        return item.name;
    }
    return `new_point_${rowIndex}`;
};

const onChange = (values: Partial<Point2D>[]) => {
    console.log(values);
};

const useSampleStyles = makeStyles({
    container: {
        overflow: 'auto',
        height: 400,
    },
});

const Template: Story<TableProps<Point2D>> = (args) => {
    const classes = useSampleStyles();
    return <Table<Point2D> classes={classes} {...args} />;
};

// 最も単純なサンプル
export const Sample = Template.bind({});
Sample.args = {
    data,
    columns,
    getRowKey,
    onChange,
    options: { sortable: false, filterable: false },
    rowsPerPage: 30,
    rowsPerPageOptions: [30, 100, 300],
    readOnly: false,
    sticky: true,
};

// ====== 空データのサンプル ======
export const EmptyRow: React.VFC<Record<string, never>> = () => {
    const [points, setPoints] = useState<Partial<Point2D>[]>([]);
    return (
        <Table<Partial<Point2D>>
            data={points}
            columns={columns}
            getRowKey={getRowKey}
            onChange={setPoints}
            options={{ sortable: false, filterable: false }}
            rowsPerPage={30}
            rowsPerPageOptions={[30, 100, 300]}
        />
    );
};

// ====== 非表示/読み取り専用/コンボボックス列サンプル ======

// Color Names — HTML Color Codes
// https://htmlcolorcodes.com/color-names/
const Colors = [
    '#f00',
    '#0f0',
    '#00f',
    '#000000',
    '#808080',
    '#c0c0c0',
    '#d3d3d3',
    '#ffffff',
    '#c71585',
    '#CD5C5C',
    '#F08080',
    '#FA8072',
    '#E9967A',
    '#FFA07A',
    '#DC143C',
    '#FF0000',
    '#B22222',
    '#8B0000',
] as const;
type Color = typeof Colors[number];
const ColorNames: Record<Color, string> = {
    '#f00': 'Red',
    '#0f0': 'Green',
    '#00f': 'Blue',
    '#000000': 'Black',
    '#808080': 'Gray',
    '#c0c0c0': 'Silver',
    '#d3d3d3': 'LightGray',
    '#ffffff': 'White',
    '#c71585': 'MediumVioletred',
    '#CD5C5C': 'IndianRed',
    '#F08080': 'LightCoral',
    '#FA8072': 'Salmon',
    '#E9967A': 'DarkSalmon',
    '#FFA07A': 'LightSalmon',
    '#DC143C': 'Crimson',
    '#FF0000': 'Red',
    '#B22222': 'FireBrick',
    '#8B0000': 'DarkRed',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// const isColor = (item: any): item is Color => {
//     return Colors.includes(item);
// };

interface Point3D {
    id: string;
    name: string;
    x: number;
    y: number;
    z: number;
    color: Color;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// const isPoint3D = (item: any): item is Point3D => {
//     return (
//         typeof item === 'object' &&
//         typeof item.id === 'string' &&
//         typeof item.name === 'string' &&
//         typeof item.x === 'number' &&
//         typeof item.y === 'number' &&
//         typeof item.z === 'number' &&
//         isColor(item.color)
//     );
// };

// 999件生成
const points: Point3D[] = [...Array(999)].map((_, index) => {
    const id = `p_${index}`;
    const name = `point_${index + 1}`;
    const color: Color = Colors[index % Colors.length];
    return {
        id,
        name,
        x: random(),
        y: random(),
        z: random(),
        color,
    };
});

// 列定義
const columns2: ColumnDefinition<Point3D>[] = [
    {
        name: 'id',
        getValue: (item) => item.id,
        defaultValue: (_: number, cells: Cell<Point3D>[][]) => `p_${cells.length + 1}`,
        hidden: true,
        required: true,
    },
    {
        name: 'color',
        getValue: (item) => `${item.color}`,
        dataList: Colors.map((c) => ({ name: ColorNames[c], value: c })),
        width: 80,
    },
    {
        name: 'name',
        getValue: (item) => item.name,
        defaultValue: (row: number) => `point_${row + 1}`,
        required: true,
        sortable: false,
    },
    {
        name: 'x',
        getValue: (item) => `${item.x}`,
        valueType: 'numeric',
        readOnly: true,
        defaultValue: '0',
        filterable: false,
    },
    {
        name: 'y',
        getValue: (item) => `${item.y}`,
        valueType: 'numeric',
    },
    {
        name: 'z',
        getValue: (item) => `${item.z}`,
        valueType: 'numeric',
    },
];

const getRowKey2 = (
    item: Point3D | undefined,
    rowIndex: number,
    cells?: Cell<Point3D>[][]
): string => {
    return item ? item.id : `p_${cells ? cells.length + 1 : 0}`;
};

// 列定義サンプル
export const ColumnDef: React.VFC<Record<string, never>> = () => (
    <Table<Point3D> data={points} columns={columns2} getRowKey={getRowKey2} />
);

// ====== カスタムコンポーネントサンプル ======

const Button: React.FC<CellRenderProps<Point3D>> = ({ cell, entity, onChange }) => {
    const handleClick = () => {
        const value = prompt('新しい名前', cell.value);
        onChange(value);
    };

    const handleClick2 = () => {
        alert(JSON.stringify(entity, null, 4));
    };

    return (
        <>
            <button onClick={handleClick}>{cell.value}</button>
            <button onClick={handleClick2}>Show Entity</button>
        </>
    );
};

// 列定義
const columns3: ColumnDefinition<Point3D>[] = [
    {
        name: 'id',
        getValue: (item) => item.id,
        defaultValue: (_: number, cells: Cell<Point3D>[][]) => `p_${cells.length + 1}`,
        hidden: true,
        required: true,
    },
    {
        name: 'name',
        getValue: (item) => item.name,
        defaultValue: (row: number) => `point_${row + 1}`,
        required: true,
        render: (props: CellRenderProps<Point3D>) => <Button {...props} />,
    },
    {
        name: 'x',
        getValue: (item) => `${item.x}`,
        valueType: 'numeric',
    },
    {
        name: 'y',
        getValue: (item) => `${item.y}`,
        valueType: 'numeric',
    },
    {
        name: 'z',
        getValue: (item) => `${item.z}`,
        valueType: 'numeric',
    },
    {
        name: 'color',
        getValue: (item) => `${item.color}`,
        dataList: Colors.map((c) => ({ name: ColorNames[c], value: c })),
    },
];

// カスタムコンポーネントサンプル
export const CustomCell: React.VFC<Record<string, never>> = () => (
    <Table<Point3D> data={points} columns={columns3} getRowKey={getRowKey2} />
);

// ====== カスタムヘッダー、フッター ======
const useStyles = makeStyles({
    root: {
        display: 'flex',
    },
    spacer: {
        flex: 1,
    },
});

function Header<T>({ onInsertRow, onDeleteRows }: HeaderProps<T>): React.ReactElement {
    const classes = useStyles();
    return (
        <div className={classes.root}>
            <p className={classes.spacer}>テスト</p>
            <button onClick={onInsertRow}>追加</button>
            <button onClick={onDeleteRows}>削除</button>
        </div>
    );
}

function Pagination<T>({
    page,
    total,
    lastPage,
    hasPrev,
    hasNext,
    rowsPerPage,
    rowsPerPageOptions,
    onChangePage,
    onChangeRowsPerPage,
}: PaginationProps<T>): React.ReactElement {
    const classes = useStyles();

    const handleClickPageFirst = (event: MouseEvent) => {
        onChangePage(event, 0);
    };
    const handleClickPagePrev = (event: MouseEvent) => {
        onChangePage(event, page - 1);
    };
    const handleClickPageNext = (event: MouseEvent) => {
        onChangePage(event, page + 1);
    };
    const handleClickPageLast = (event: MouseEvent) => {
        onChangePage(event, lastPage);
    };

    return (
        <div className={classes.root}>
            <button disabled={!hasPrev} onClick={handleClickPageFirst}>
                ⏪
            </button>
            <button disabled={!hasPrev} onClick={handleClickPagePrev}>
                ◀
            </button>
            <button disabled={!hasNext} onClick={handleClickPageNext}>
                ▶
            </button>
            <button disabled={!hasNext} onClick={handleClickPageLast}>
                ⏩
            </button>
            <select value={rowsPerPage} onChange={onChangeRowsPerPage}>
                {rowsPerPageOptions.map((value) => (
                    <option key={`rows-per-page-options-${value}`} value={value}>
                        {value}
                    </option>
                ))}
            </select>
            <span>
                {1 + page * rowsPerPage} - {Math.min(page * rowsPerPage + rowsPerPage, total)} /{' '}
                {total}
            </span>
            <span>page: {page + 1}</span>
        </div>
    );
}

function ColumnHeader<T>({
    className,
    column,
    sort,
    filter,
}: ColumnHeaderProps<T>): React.ReactElement {
    const classes = useStyles();
    const { filterable, ...filterProps } = filter;
    return (
        <th className={className}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    {column.displayName ?? column.name}
                    <div className={classes.spacer} />
                    {sort.sortable && <SortButton {...sort} />}
                </div>
                {filterable && <input type="text" {...filterProps} />}
            </div>
        </th>
    );
}

const useCustomHeaderStyles = makeStyles({
    tbody: {
        backgroundColor: '#ffc',
    },
    cell: {
        color: '#009',
    },
});

export const CustomHeader: React.VFC<Record<string, never>> = () => {
    const classes = useCustomHeaderStyles();
    return (
        <Table<Point2D>
            classes={classes}
            data={data}
            columns={columns}
            getRowKey={getRowKey}
            renderColumnHeader={ColumnHeader}
            renderHeader={Header}
            renderPagination={Pagination}
        />
    );
};

/**
 * 更新サンプル
 * @returns
 */
export const UpdateSample: React.VFC<Record<string, never>> = () => {
    return <UpdateDataSample />;
};

/**
 * 行選択サンプル
 * @returns
 */
export const ForwardDemo: React.VFC<Record<string, never>> = () => {
    return <ForwardSample />;
};
