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
import {
	DateTableCell,
	TimeSpentTableCell,
	IssuesTableCell,
	LogWorkTableCell,
	TableTopContent
} from '@/app/worklogs/_components';
import { LoggedWork, Worklogs } from '@/app/worklogs/_actions';

const WorklogsPage = () => {
	const [worklogs, setWorklogs] = useState<Worklogs>([]);
	const [isLoading, setIsLoading] = useState(false);

	const columns = [
		{ key: 'date', label: 'DATE' },
		{ key: 'timeSpent', label: 'TIME SPENT' },
		{ key: 'issues', label: 'ISSUES' },
		{ key: 'logWork', label: 'LOG WORK' }
	];

	const handleLoggedWorkSuccess = (data: LoggedWork) => {
		setWorklogs((prev) =>
			prev.map((w) =>
				new Date(w.date).toDateString() === new Date(data.date).toDateString()
					? { ...w, totalTimeSpentSeconds: w.totalTimeSpentSeconds + data.timeSpentSeconds }
					: w
			)
		);
	};

	const handleWorklogsFetch = useCallback<(params: { data: Worklogs; isLoading: boolean }) => void>(
		({ data, isLoading }) => {
			if (isLoading) {
				setWorklogs([]);
			} else {
				setWorklogs(data);
			}
			setIsLoading(isLoading);
		},
		[]
	);

	const rows = useMemo(
		() =>
			worklogs.map((w) => ({
				key: w.date,
				date: <DateTableCell data={w} />,
				timeSpent: <TimeSpentTableCell data={w} />,
				issues: <IssuesTableCell data={w} />,
				logWork: (
					<LogWorkTableCell
						data={w}
						onFetchSuccess={handleLoggedWorkSuccess}
					/>
				)
			})),
		[worklogs]
	);

	return (
		<Table
			shadow="md"
			isHeaderSticky
			aria-label="Worklog table"
			className="max-h-[calc(100dvh-5rem)]"
			topContent={<TableTopContent onFetch={handleWorklogsFetch} />}>
			<TableHeader columns={columns}>
				{(column) => (
					<TableColumn
						align={column.key === 'date' ? 'start' : 'center'}
						width={
							column.key === 'date'
								? '300'
								: column.key === 'timeSpent'
									? '400'
									: column.key === 'issues'
										? '500'
										: column.key === 'logWork'
											? '100'
											: undefined
						}
						key={column.key}>
						{column.label}
					</TableColumn>
				)}
			</TableHeader>
			<TableBody
				items={rows}
				isLoading={isLoading}
				loadingContent={<Skeleton className="h-full w-full" />}
				emptyContent="Click 'Load worklogs'">
				{(item) => (
					<TableRow key={item.key}>
						{(columnKey) => <TableCell>{getKeyValue(item, columnKey)}</TableCell>}
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
};
export default WorklogsPage;
