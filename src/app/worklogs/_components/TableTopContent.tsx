import { Button, ButtonGroup, DatePicker, Skeleton } from '@nextui-org/react';
import { getWorklogs, Issue, type Worklogs } from '@/app/worklogs/_actions/getWorklogs';
import { useEffect, useState } from 'react';
import { useDateRange } from '@/app/worklogs/_hooks/useDateRange';
import { toast } from 'react-hot-toast/headless';
import { useMediaQuery } from 'react-responsive';

import { today as todayInternationalized, getLocalTimeZone, CalendarDate } from '@internationalized/date';
import { postSquadery } from '@/app/worklogs/_actions/syncSquadery';

export const TableTopContent = ({
	onFetch
}: Readonly<{ onFetch: (params: { data: Worklogs; isLoading: boolean }) => void }>) => {
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true);
	}, []);

	const screenSmallerThanSM = useMediaQuery({ maxWidth: 640 });

	const [isLoading, setIsLoading] = useState(false);
	const [data, setData] = useState<Worklogs>([]);

	// const { dateRange, setDateRange, selectedDateRange } = useDateRange();

	const now = todayInternationalized(getLocalTimeZone());
	const [date, setDate] = useState(now.subtract({ days: 12 }));

	useEffect(() => {
		onFetch({ data, isLoading });
	}, [data, isLoading, onFetch]);

	const handleWorklogsFetch = async () => {
		setIsLoading(true);
		// const res = await getWorklogs({
		// 	dateStart: dateRange.start.toString(),
		// 	dateEnd: dateRange.end.toString()
		// });
		const res = await getWorklogs({
			dateStart: date.toString(),
			dateEnd: date.toString()
		});
		if (res.status === 'success') setData(res.data);
		if (res.status === 'error') res.errors.forEach((error) => toast.error(error));
		setIsLoading(false);
	};

	const handleSquaderySync = async () => {
		setIsLoading(true);
		const res = await postSquadery({
			data: JSON.stringify(data),
			dateStart: date.toString()
		});
		if (res.status === 'success') res.data && toast.success('Synced successfully');
		if (res.status === 'error') res.errors?.forEach((error) => toast.error(error));

		setIsLoading(false);
	};

	// noinspection RequiredAttributes - DateRangePicker seems to have wrongly typed required attributes
	return (
		<Skeleton
			isLoaded={mounted}
			className="rounded-lg">
			<div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end md:justify-between">
				<DatePicker
					aria-label="Date range"
					className="md:max-w-xs"
					visibleMonths={screenSmallerThanSM ? 1 : 2}
					value={date}
					onChange={setDate}
				/>

				{/* <ButtonGroup
					className="hidden sm:block"
					variant="flat">
					<Button
						color={selectedDateRange === 'today' ? 'primary' : 'default'}
						onClick={() => setDateRange('today')}>
						Today
					</Button>
					<Button
						color={selectedDateRange === 'thisWeek' ? 'primary' : 'default'}
						onClick={() => setDateRange('thisWeek')}>
						This week
					</Button>
					<Button
						color={selectedDateRange === 'thisMonth' ? 'primary' : 'default'}
						onClick={() => setDateRange('thisMonth')}>
						This month
					</Button>
					<Button
						color={selectedDateRange === 'last15Days' ? 'primary' : 'default'}
						onClick={() => setDateRange('last15Days')}>
						Last 15 days
					</Button>
					<Button
						color={selectedDateRange === 'last30Days' ? 'primary' : 'default'}
						onClick={() => setDateRange('last30Days')}>
						Last 30 days
					</Button>
				</ButtonGroup> */}

				<Button
					className="mr-auto sm:ml-auto sm:mr-0"
					onClick={handleWorklogsFetch}
					color="primary">
					Load worklogs
				</Button>
				<Button
					className="mr-auto sm:ml-auto sm:mr-0"
					onClick={handleSquaderySync}
					disabled={!data.length}
					color={!data.length ? 'default' : 'warning'}
					>
					Squadery Sync
				</Button>
			</div>
		</Skeleton>
	);
};
