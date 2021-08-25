import {
    Button,
    FormControl,
    InputLabel,
    makeStyles,
    MenuItem,
    Select,
    TextField,
} from '@material-ui/core';
import React, { ChangeEvent, useCallback, useMemo, useRef, useState } from 'react';
import { ColumnDefinition, GenerateRowKeyFunction, Table, TableHandles } from '../../../../src';
import { defaultUsers, FieldNames, User } from './data';

const useStyles = makeStyles({
    root: {
        //
    },
    form: {
        display: 'flex',
        marginBottom: '1rem',
    },
    control: {
        marginRight: 16,
        width: 200,
    },
    table: {
        flex: 1,
        height: 500,
    },
});

interface Parameters {
    key: keyof User;
    value: string;
}

const ForwardSample: React.VFC = () => {
    const classes = useStyles();
    const [users, setUsers] = useState<Partial<User>[]>(defaultUsers);
    const [params, setParams] = useState<Parameters>({ key: 'id', value: '' });

    const ref = useRef<TableHandles<User>>();

    const getRowKey: GenerateRowKeyFunction<User> = useCallback((item, _, cells) => {
        if (item) {
            return item.id;
        }
        return `${cells.length + 1}`;
    }, []);

    const columns: ColumnDefinition<User>[] = useMemo(
        () => [
            {
                name: 'id',
                displayName: FieldNames['id'],
                getValue: (item) => item.id,
                defaultValue: () => `${users.length + 1}`,
                required: true,
                hidden: true,
            },
            {
                name: 'name',
                displayName: FieldNames['name'],
                getValue: (item) => item.name,
                required: true,
            },
            {
                name: 'kana',
                displayName: FieldNames['kana'],
                getValue: (item) => item.kana,
                required: true,
            },
            {
                name: 'tel',
                displayName: FieldNames['tel'],
                getValue: (item) => item.tel,
            },
            {
                name: 'email',
                displayName: FieldNames['email'],
                getValue: (item) => item.email,
                unique: true,
            },
            {
                name: 'zip',
                displayName: FieldNames['zip'],
                getValue: (item) => item.zip,
            },
            {
                name: 'address',
                displayName: FieldNames['address'],
                getValue: (item) => item.address,
            },
        ],
        [users.length]
    );

    const handleChange = useCallback((items: Partial<User>[]) => {
        setUsers(items);
    }, []);

    const handleChangeParams = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setParams((state) => ({
            ...state,
            [name]: value,
        }));
    }, []);

    const handleClick = useCallback(() => {
        if (ref.current) {
            ref.current.selectByKeyValue(params.key, params.value);
        }
    }, [params.key, params.value]);

    return (
        <div className={classes.root}>
            <div className={classes.form}>
                <FormControl className={classes.control}>
                    <InputLabel id="forward-sample-select-label">選択項目</InputLabel>
                    <Select
                        id="forward-sample-select"
                        labelId="forward-sample-select-label"
                        name="key"
                        value={params.key}
                        onChange={handleChangeParams}
                    >
                        <MenuItem value="id">Id</MenuItem>
                        <MenuItem value="address">住所</MenuItem>
                    </Select>
                </FormControl>
                <TextField
                    className={classes.control}
                    id="forward-sample-text"
                    label="選択する値"
                    name="value"
                    value={params.value}
                    onChange={handleChangeParams}
                />
                <Button variant="contained" onClick={handleClick}>
                    選択
                </Button>
            </div>
            <div className={classes.table}>
                <Table<Partial<User>>
                    ref={ref}
                    data={users}
                    columns={columns}
                    getRowKey={getRowKey}
                    onChange={handleChange}
                    sticky
                    rowNumber
                />
            </div>
        </div>
    );
};

export default ForwardSample;
