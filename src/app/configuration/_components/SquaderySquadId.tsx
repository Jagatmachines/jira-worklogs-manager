'use client';

import { Button, Input, Skeleton, Spinner } from '@nextui-org/react';
import { useCookieInput } from '@/app/configuration/_hooks/useCookieInput';
import { InfoIcon } from '@nextui-org/shared-icons';

export const SquaderySquadId = () => {
	const { isLoaded, value, setValue, description, isProcessingValue, isProcessingSubmit, handleSubmit } =
		useCookieInput('squaderySquadId');

	return (
		<Skeleton
			isLoaded={isLoaded}
			className="rounded-lg">
			<div
				className="flex gap-2"
				style={{ alignItems: description ? 'center' : 'end' }}>
				<Input
					type="text"
					label="Squadery Squad ID"
					labelPlacement="outside"
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onKeyDown={(e) => !isProcessingSubmit && description && e.key === 'Enter' && handleSubmit(value)}
					description={
						description && (
							<span className="flex items-center gap-1">
								<InfoIcon />
								{description}
							</span>
						)
					}
					endContent={
						isProcessingValue && (
							<Spinner
								color="current"
								className="opacity-75"
								size="sm"
							/>
						)
					}
				/>
				<Button
					onClick={() => handleSubmit(value)}
					isDisabled={!description}
					isLoading={isProcessingSubmit}
					color="primary">
					Submit
				</Button>
			</div>
		</Skeleton>
	);
};
