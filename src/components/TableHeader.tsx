import { makeStyles } from '@material-ui/core';
import classnames from 'classnames';
import React from 'react';
import ColumnHeader from './ColumnHeader';
import {
    ColumnDefinition,
    ColumnHeaderProps,
    FilterProps,
    SortProps,
    TableCssClasses,
} from './types';

interface Props<T> {
    classes?: TableCssClasses;
    columns: ColumnDefinition<T>[];
    sticky?: boolean;
    getFilterProps: (name: keyof T) => FilterProps;
    getSortProps: (name: keyof T) => SortProps;
    onSelectAll: VoidFunction;
    renderColumnHeader?: (props: ColumnHeaderProps<T>) => React.ReactElement;
}

const useStyles = makeStyles((theme) => ({
    headerRow: {
        //
    },
    headerCell: {
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: '#ccc',
        borderRightWidth: 1,
        borderRightStyle: 'solid',
        borderRightColor: '#ccc',
        backgroundColor: 'rgb(247,248,249)',
        padding: '0.3rem',
    },
    rowHeaderCell: {
        boxSizing: 'border-box',
        width: '1.4rem',
    },
    stickyRowHeaderCell: {
        position: 'sticky',
        top: 0,
        left: 0,
        zIndex: 2,
    },
    stickyHeaderCell: {
        position: 'sticky',
        top: 0,
        zIndex: 1,
    },
}));

function TableHeader<T>({
    classes,
    columns,
    sticky = false,
    getFilterProps,
    getSortProps,
    onSelectAll,
    renderColumnHeader: CustomColumnHeader,
}: Props<T>): React.ReactElement {
    const baseClasses = useStyles();

    return (
        <thead>
            <tr className={classnames(baseClasses.headerRow, classes.headerRow)}>
                <th
                    className={classnames(
                        {
                            [baseClasses.stickyRowHeaderCell]: sticky,
                        },
                        baseClasses.headerCell,
                        baseClasses.rowHeaderCell,
                        classes.headerCell
                    )}
                    onClick={onSelectAll}
                />
                {columns.map((column, index) => {
                    if (column.hidden) {
                        return undefined;
                    }

                    const key = `awesome-table-header-${column.name}-${index}`;
                    const sortProps = getSortProps(column.name);
                    const filterProps = getFilterProps(column.name);

                    if (CustomColumnHeader) {
                        return (
                            <CustomColumnHeader
                                key={key}
                                className={classnames(
                                    {
                                        [baseClasses.stickyHeaderCell]: sticky,
                                    },
                                    baseClasses.headerCell,
                                    classes.headerCell
                                )}
                                column={column}
                                sort={sortProps}
                                filter={filterProps}
                            />
                        );
                    }

                    return (
                        <ColumnHeader
                            key={key}
                            className={classnames(
                                {
                                    [baseClasses.stickyHeaderCell]: sticky,
                                },
                                baseClasses.headerCell,
                                classes.headerCell
                            )}
                            column={column}
                            sort={sortProps}
                            filter={filterProps}
                        />
                    );
                })}
            </tr>
        </thead>
    );
}

export default TableHeader;
