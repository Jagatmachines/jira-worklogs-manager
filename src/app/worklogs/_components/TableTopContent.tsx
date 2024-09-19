import { Button, ButtonGroup, DateRangePicker, Skeleton } from '@nextui-org/react';
import { getWorklogs, type Worklogs } from '@/app/worklogs/_actions';
import { useEffect, useState } from 'react';
import { useDateRange } from '@/app/worklogs/_hooks/useDateRange';
import { toast } from 'react-hot-toast/headless';

export const TableTopContent = ({
	onFetch
}: Readonly<{ onFetch: (params: { data: Worklogs; isLoading: boolean }) => void }>) => {
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true);
	}, []);

	const [isLoading, setIsLoading] = useState(false);
	const [data, setData] = useState<Worklogs>([]);

	const { dateRange, setDateRange, selectedDateRange } = useDateRange();

	useEffect(() => {
		onFetch({ data, isLoading });
	}, [data, isLoading, onFetch]);

	const handleWorklogsFetch = async () => {
		setIsLoading(true);
		const res = await getWorklogs({
			dateStart: dateRange.start.toString(),
			dateEnd: dateRange.end.toString()
		});
		if (res.status === 'success') setData(res.data);
		if (res.status === 'error') res.errors.forEach((error) => toast.error(error));
		setIsLoading(false);
	};

	return (
		<Skeleton
			isLoaded={mounted}
			className="rounded-lg">
			<div className="flex flex-wrap items-end justify-between gap-2">
				<DateRangePicker
					aria-label="Date range"
					className="max-w-xs"
					visibleMonths={2}
					value={dateRange}
					onChange={setDateRange}
				/>

				<ButtonGroup variant="flat">
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
				</ButtonGroup>

				<Button
					onClick={handleWorklogsFetch}
					color="primary">
					Load worklogs
				</Button>
			</div>
		</Skeleton>
	);
};
