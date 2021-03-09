import { makeStyles } from '@material-ui/styles';
import { Meta } from '@storybook/react/types-6-0';
import React, { MouseEvent, useMemo } from 'react';
import SortButton from '../../src/components/SortButton';
import Table from '../../src/components/Table';
import {
    Cell,
    CellRenderProps,
    ColumnDefinition,
    ColumnHeaderProps,
    HeaderProps,
    PaginationProps,
} from '../../src/components/types';

export default {
    title: 'components/Table',
    component: Table,
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
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// const isPoint2D = (item: any): item is Point2D => {
//     return (
//         typeof item === 'object' &&
//         typeof item.name === 'string' &&
//         typeof item.x === 'number' &&
//         typeof item.y === 'number'
//     );
// };

// 1000件生成
const data: Point2D[] = [...Array(999)].map((_, index) => {
    const name = `point_${index + 1}`;
    return {
        name,
        x: random(),
        y: random(),
    };
});

// 列定義
const columns: ColumnDefinition<Point2D>[] = [
    {
        name: 'name',
        getValue: (item) => item.name,
        defaultValue: (row: number) => `point_${row + 1}`,
        required: true,
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

// 最も単純なサンプル
export const Sample: React.VFC<Record<string, never>> = () => (
    <Table<Point2D>
        data={data}
        columns={columns}
        getRowKey={getRowKey}
        onChange={onChange}
        options={{ sortable: false, filtable: false }}
    />
);

// ====== 非表示/読み取り専用/コンボボックス列サンプル ======

const Colors = ['Red', 'Green', 'Blue'] as const;
type Color = typeof Colors[number];
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

// 1000件生成
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
        name: 'name',
        getValue: (item) => item.name,
        defaultValue: (row: number) => `point_${row + 1}`,
        required: true,
    },
    {
        name: 'x',
        getValue: (item) => `${item.x}`,
        valueType: 'numeric',
        readOnly: true,
        defaultValue: '0',
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
        dataList: Colors.map((c) => ({ name: c, value: c })),
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

const Button: React.FC<CellRenderProps<Point3D>> = ({ location, row }) => {
    const cell = row[location.column];

    // rowKeyをもとに元の要素を取得する
    const entity = useMemo(() => {
        return points.find((p) => getRowKey2(p, location.row) === cell.rowKey);
    }, [cell.rowKey, location.row]);

    const handleClick = () => {
        let message = '該当のデータが見つからなかったよ';
        if (entity) {
            message = `${entity.id}: ${entity.name}`;
        }
        alert(message);
    };

    return <button onClick={handleClick}>{cell.value}</button>;
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
        dataList: Colors.map((c) => ({ name: c, value: c })),
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
    const { filtable, ...filterProps } = filter;
    return (
        <th className={className}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    {column.displayName ?? column.name}
                    <div className={classes.spacer} />
                    {sort.sortable && <SortButton {...sort} />}
                </div>
                {filtable && <input type="text" {...filterProps} />}
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
