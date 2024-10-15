'use client';

import {
	getKeyValue,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
	Skeleton
} from '@nextui-org/react';
import { useState, useMemo, useCallback } from 'react';
import { DateTableCell } from '@/app/worklogs/_components/DateTableCell';
import { TimeSpentTableCell } from '@/app/worklogs/_components/TimeSpentTableCell';
import { IssuesTableCell } from '@/app/worklogs/_components/IssuesTableCell';
import { LogWorkTableCell } from '@/app/worklogs/_components/LogWorkTableCell';
import { TableTopContent } from '@/app/worklogs/_components/TableTopContent';
import { Worklogs } from '@/app/worklogs/_actions/getWorklogs';
import { LoggedWork } from '@/app/worklogs/_actions/logWork';
import { isWeekend as getIsWeekend, CalendarDate } from '@internationalized/date';
import { useLocale } from '@react-aria/i18n';
import { ColumnSize } from '@react-types/table';

const WorklogsPage = () => {
	const [worklogs, setWorklogs] = useState<Worklogs>([]);
	const [isLoading, setIsLoading] = useState(false);
	const { locale } = useLocale();

	const handleLoggedWorkSuccess = useCallback<(data: LoggedWork) => void>(
		(data) =>
			setWorklogs((prev) => {
				return prev.map((w) =>
					new Date(w.date).toDateString() === new Date(data.date).toDateString()
						? { ...w, totalTimeSpentSeconds: w.totalTimeSpentSeconds + data.timeSpentSeconds }
						: w
				)
			}),
		[]
	);

	const handleWorklogsFetch = useCallback<(params: { data: Worklogs; isLoading: boolean }) => void>(
		({ data, isLoading }) => {
			// console.log({ data })
			if (isLoading) {
				setWorklogs([]);
			} else {
				setWorklogs(data);
			}
			setIsLoading(isLoading);
		},
		[]
	);

	const disabledRows = useMemo(
		() =>
			worklogs.reduce<string[]>((acc, w) => {
				const dateInstance = new Date(w.date);
				const year = dateInstance.getFullYear();
				const month = dateInstance.getMonth() + 1;
				const day = dateInstance.getDate();
				const isWeekend = getIsWeekend(new CalendarDate(year, month, day), locale);

				if (isWeekend) return [...acc, w.date];
				if (w.isHoliday) return [...acc, w.date];
				return acc;
			}, []),
		[worklogs, locale]
	);

	const columns = [
		{ key: 'date', label: 'DATE' },
		{ key: 'timeSpent', label: 'TIME SPENT' },
		{ key: 'issues', label: 'ISSUES' },
		// { key: 'logWork', label: 'LOG WORK' }
	];

	const getColumnWidth = useCallback<(key: string) => ColumnSize | undefined>((key) => {
		switch (key) {
			case 'date':
				return '100';
			case 'timeSpent':
				return '100';
			case 'issues':
				return '500';
			// case 'logWork':
			// 	return '100';
			default:
				return undefined;
		}
	}, []);

	const rows = useMemo(
		() =>
			worklogs.map((w) => ({
				key: w.date,
				date: <DateTableCell data={w} />,
				timeSpent: <TimeSpentTableCell data={w} />,
				issues: (
					<IssuesTableCell
						data={w}
						isWeekend={disabledRows.includes(w.date)}
					/>
				),
				logWork: (
					<LogWorkTableCell
						data={w}
						onFetchSuccess={handleLoggedWorkSuccess}
						isWeekend={disabledRows.includes(w.date)}
					/>
				)
			})),
		[worklogs, handleLoggedWorkSuccess, disabledRows]
	);

	// console.log('WorklogsPage render');

	return (
		<>
			<Table
				shadow="md"
				isHeaderSticky
				disabledKeys={disabledRows}
				aria-label="Worklog table"
				className="max-h-[calc(100dvh-5rem)]"
				topContent={<TableTopContent onFetch={handleWorklogsFetch} />}>
				<TableHeader columns={columns}>
					{(column) => (
						<TableColumn
							align={column.key === 'date' ? 'start' : 'center'}
							width={getColumnWidth(column.key)}
							key={column.key}>
							{column.label}
						</TableColumn>
					)}
				</TableHeader>
				<TableBody
					items={rows}
					isLoading={isLoading}
					loadingContent={<Skeleton className="absolute inset-0" />}
					emptyContent="Click 'Load worklogs  123'">
					{(item) => (
						<TableRow key={item.key}>
							{(columnKey) => <TableCell>{getKeyValue(item, columnKey)}</TableCell>}
						</TableRow>
					)}
				</TableBody>
			</Table>
		</>
	);
};
export default WorklogsPage;
