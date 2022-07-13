import React from 'react';
import { Table } from 'antd';
import moment from 'moment';

type TablePropsTuple = Parameters<typeof Table>;
type TableProps = TablePropsTuple[0];

export
interface IProps
extends TableProps {

}

export
function TransactionList(props: IProps) {
  return <Table
    { ...props }
    pagination={false}
    columns={[
      {
        title: '操作',
        dataIndex: 'side',
      },
      {
        title: '方向',
        dataIndex: 'direction',
      },
      {
        title: '请求时间',
        dataIndex: 'request_time',
        render: (value: number) => {
          return <span>{moment(new Date(value)).format('YYYY-MM-DD HH:mm:ss')}</span>;
        },
      },
      {
        title: '成交时间',
        dataIndex: 'transaction_time',
        render: (value: number) => {
          return <span>{moment(new Date(value)).format('YYYY-MM-DD HH:mm:ss')}</span>;
        },
      },
      {
        title: '响应时间',
        dataIndex: 'response_time',
        render: (value: number) => {
          return <span>{moment(new Date(value)).format('YYYY-MM-DD HH:mm:ss')}</span>;
        },
      },
      {
        title: '输入资产',
        dataIndex: 'in_name',
      },
      {
        title: '期望输入资产数量',
        dataIndex: 'expected_in_amount',
      },
      {
        title: '成交输入资产数量',
        dataIndex: 'in_amount',
      },
      {
        title: '期望价格',
        dataIndex: 'expected_price',
      },
      {
        title: '成交价格',
        dataIndex: 'price',
      },
      {
        title: '输出资产',
        dataIndex: 'out_name',
      },
      {
        title: '输出资产数量',
        dataIndex: 'out_amount',
      },
    ]}
  />;
}
