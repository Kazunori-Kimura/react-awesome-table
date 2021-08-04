import { makeStyles } from '@material-ui/styles';
import classnames from 'classnames';
import React, { useState } from 'react';
import { ColumnDefinition, DataListType, GenerateRowKeyFunction, Table } from '../../../../src';

/**
 * レア度
 */
const Ranks = ['SSR', 'SR', 'R'] as const;
type Rank = typeof Ranks[number];
const RankList: DataListType = Ranks.map((rank) => ({
    name: rank,
    value: rank,
}));

/**
 * カードタイプ
 */
const CardTypes = ['Speed', 'Stamina', 'Power', 'Guts', 'Intelligence', 'Friend'] as const;
type CardType = typeof CardTypes[number];
const CardTypeNames: Readonly<Record<CardType, string>> = {
    Speed: 'スピード',
    Stamina: 'スタミナ',
    Power: 'パワー',
    Guts: '根性',
    Intelligence: '賢さ',
    Friend: '友人',
};
const CardTypeList: DataListType = CardTypes.map((item) => ({
    name: CardTypeNames[item],
    value: item,
}));

interface SupportCard {
    cardId: number;
    name: string;
    rank: Rank;
    type: CardType;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// const isSupportCard = (item: any): item is SupportCard => {
//     return (
//         typeof item.cardId === 'number' &&
//         typeof item.name === 'string' &&
//         Ranks.includes(item.rank) &&
//         CardTypes.includes(item.type)
//     );
// };

const initialCards: SupportCard[] = [
    {
        cardId: 1,
        name: 'ツインターボ',
        rank: 'SSR',
        type: 'Speed',
    },
    {
        cardId: 2,
        name: 'ライスシャワー',
        rank: 'SSR',
        type: 'Stamina',
    },
    {
        cardId: 3,
        name: 'セイウンスカイ',
        rank: 'SSR',
        type: 'Intelligence',
    },
    {
        cardId: 4,
        name: 'キングヘイロー',
        rank: 'SSR',
        type: 'Power',
    },
    {
        cardId: 5,
        name: 'ゴールドシップ',
        rank: 'SSR',
        type: 'Speed',
    },
    {
        cardId: 6,
        name: 'ゼンノロブロイ',
        rank: 'SR',
        type: 'Stamina',
    },
    {
        cardId: 7,
        name: 'マーベラスサンデー',
        rank: 'SR',
        type: 'Intelligence',
    },
    {
        cardId: 8,
        name: 'スイープトウショウ',
        rank: 'SR',
        type: 'Speed',
    },
];

const useStyles = makeStyles({
    root: {
        display: 'flex',
        height: 340,
    },
    column: {
        flex: 1,
        maxWidth: '50vw',
    },
    preview: {
        margin: 9,
        padding: 6,
        border: '1px solid #ccc',
        borderRadius: 6,
        backgroundColor: '#f3f3f3',
        overflow: 'auto',
    },
});

const UpdateDataSample: React.FC = () => {
    const [cards, setCards] = useState<Partial<SupportCard>[]>(initialCards);
    const classes = useStyles();

    const getRowKey: GenerateRowKeyFunction<SupportCard> = (item, _, cells) => {
        if (item) {
            return `card_${item.cardId}`;
        }
        return `card_${cells.length + 1}`;
    };

    const columns: ColumnDefinition<SupportCard>[] = [
        {
            name: 'cardId',
            displayName: 'ID',
            getValue: (item) => `${item.cardId}`,
            defaultValue: (_, cells) => `${cells.length + 1}`,
            valueType: 'numeric',
            required: true,
            width: 80,
        },
        {
            name: 'name',
            displayName: 'カード',
            getValue: (item) => item.name,
            required: true,
        },
        {
            name: 'rank',
            displayName: 'ランク',
            getValue: (item) => item.rank,
            dataList: RankList,
            required: true,
        },
        {
            name: 'type',
            displayName: 'タイプ',
            getValue: (item) => item.type,
            dataList: CardTypeList,
            required: true,
        },
    ];

    const handleChange = (items: Partial<SupportCard>[]) => {
        setCards(items);
    };

    return (
        <div className={classes.root}>
            <div className={classes.column}>
                <Table<Partial<SupportCard>>
                    data={cards}
                    columns={columns}
                    getRowKey={getRowKey}
                    onChange={handleChange}
                    sticky
                    rowNumber
                />
            </div>
            <div className={classnames(classes.column, classes.preview)}>
                <pre>{JSON.stringify(cards, null, 4)}</pre>
            </div>
        </div>
    );
};

export default UpdateDataSample;
