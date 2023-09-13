import React, { FC, useRef } from 'react'
import { Button, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import s from './style.module.scss'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { useReactToPrint } from 'react-to-print'
import { renderCurrency } from '@common/components/DashboardPage/blocks/payments'
import { filterInvoiceObject, getFormattedDate } from '@utils/helpers'
import numberToTextNumber from '@utils/numberToText'
import useService from '@common/modules/hooks/useService'
import moment from 'moment'
import { ServiceType } from '@utils/constants'

interface Props {
  currPayment: IExtendedPayment
  paymentData: any
}

interface DataType {
  id: number
  // TODO: українською? - тут щось не так.
  Назва: string
  Кількість: number
  Ціна: number
  Сума: number
}

const ReceiptForm: FC<Props> = ({ currPayment, paymentData }) => {
  const newData = currPayment || paymentData
  const componentRef = useRef()
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle:
      (newData.company.companyName || newData.reciever.companyName) +
      '-inv-' +
      newData.invoiceNumber,
  })

  const { service } = useService({
    serviceId: newData?.monthService,
    skip: !!paymentData,
  })

  const dataToMap = paymentData
    ? newData?.invoice
    : filterInvoiceObject(newData)

  const dataSourcePreview: DataType[] = dataToMap.map((item, index) => ({
    Кількість: item.lastAmount ? item.amount - item.lastAmount : item.amount,
    Назва: `${fieldNames[item.type] || item.name} ${getDispalyedDate(
      paymentData,
      service?.date,
      item.type
    )}`,
    Ціна: +item.price,
    Сума: +item.sum,
    id: index + 1,
  }))

  return (
    <>
      <div
        className={s.invoiceContainer}
        ref={componentRef}
        style={{
          width: '100%',
          height: '100%',
          marginTop: '2em',
          marginRight: '1.5em',
          marginLeft: '1.5em',
        }}
      >
        <>
          <div className={s.providerInfo}>
            <div className={s.label}>Постачальник</div>
            <pre>
              {newData?.provider?.description} <br />
              <br />
            </pre>
          </div>

          <div className={s.receiverInfo}>
            <div className={s.label}>Одержувач</div>
            <pre>
              {newData?.reciever?.description} <br />
              {newData?.reciever?.companyName} <br />
              {newData?.reciever?.adminEmails?.map((email) => (
                <div key={email}>
                  {email} <br />
                </div>
              ))}
            </pre>
          </div>
        </>

        <div className={s.providerInvoice}>
          <div className={s.datecellTitle}>
            INVOICE № INV-{newData.invoiceNumber}
          </div>
          <div className={s.datecellDate}>
            Від &nbsp;
            {moment(newData?.invoiceCreationDate)?.format?.('DD.MM.YYYY')}
            &nbsp; року.
          </div>
          <div className={s.datecell}>
            Підлягає сплаті до &nbsp;
            {moment(newData?.invoiceCreationDate)
              .add(5, 'd')
              .format('DD.MM.YYYY')}
            &nbsp; року
          </div>
        </div>
        <div className={s.tableSum}>
          <Table
            columns={columns}
            dataSource={dataSourcePreview}
            size="small"
            pagination={false}
          />
        </div>
        <div className={s.payTable}>
          <SumWithText data={newData} />
          <div className={s.payFixed}>
            Загальна сума оплати:
            <div className={s.payBoldSum}>
              {newData?.generalSum || newData?.debit} грн
            </div>
          </div>

          <div className={s.payFixed}>
            {newData?.provider?.description?.split('\n')?.[0] || ''}
            <div className={s.lineInner}>________________</div>
          </div>
        </div>

        <div className={s.endInfo}>
          <div className={s.endInfobolt}>Примітка:</div> *Ціна за комунальні
          послуги вказана з урахуванням ПДВ.
          <br />
          **Ціни на комунальні послуги виставляють компанії-постачальники,
          відповідно їх ціна може <br />
          змінюватись у будь-який час в односторонньму порядку
          компанією-постачальником.
        </div>
      </div>

      <Button type="primary" onClick={handlePrint}>
        {' '}
        Роздрукувати Документ
      </Button>
    </>
  )
}

function SumWithText({ data }) {
  const rest = numberToTextNumber(data?.generalSum || data?.debit)
  return (
    rest && (
      <div className={s.payFixed}>
        Всього на суму:
        <div className={s.payBold}>
          {rest}
          &nbsp;грн
        </div>
      </div>
    )
  )
}

const columns: ColumnsType<DataType> = [
  {
    title: '№',
    dataIndex: 'id',
    width: '10%',
  },
  {
    title: 'Назва',
    dataIndex: 'Назва',
    width: '30%',
  },
  {
    title: 'Кількість',
    dataIndex: 'Кількість',
    width: '15%',
  },
  {
    title: 'Ціна',
    dataIndex: 'Ціна',
    width: '15%',
    render: renderCurrency,
  },
  {
    title: 'Сума',
    dataIndex: 'Сума',
    width: '15%',
    render: renderCurrency,
  },
]

const fieldNames = {
  maintenancePrice: 'Утримання',
  placingPrice: 'Розміщення',
  waterPrice: 'За водопостачання',
  waterPart: 'За водопостачання (без лічильника)',
  electricityPrice: 'За електропостачання',
  garbageCollectorPrice: 'За вивіз ТПВ',
  inflicionPrice: 'Індекс інфляції',
  discount: 'Знижка',
}

// TODO: move to helper
export function getDispalyedDate(paymentData, serviceDate, itemType) {
  const date = getFormattedDate(
    paymentData
      ? paymentData?.monthService?.date || paymentData.invoiceCreationDate
      : serviceDate
  )
  return itemType !== ServiceType.Inflicion && date ? `(${date})` : ''
}

export default ReceiptForm
