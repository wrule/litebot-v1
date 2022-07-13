import React from 'react';
import { TransactionList } from '../../components/transaction_list';
import data from '../../components/transaction_list/data.json';

export
function Home() {
  return <div>
    <TransactionList
      dataSource={data}>
    </TransactionList>
  </div>;
}
