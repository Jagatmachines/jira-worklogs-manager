'use client';

import { Button, Input, Skeleton, Spinner } from '@nextui-org/react';
import { useCookieInput } from '@/app/configuration/_hooks/useCookieInput';
import { EyeFilledIcon, EyeSlashFilledIcon, InfoIcon } from '@nextui-org/shared-icons';
import { useState } from 'react';

export const SquaderyTokenInput = () => {
	const { isLoaded, value, setValue, description, isProcessingValue, isProcessingSubmit, handleSubmit } =
		useCookieInput('squaderyToken');
	const [isVisible, setIsVisible] = useState(false);

	return (
		<Skeleton
			isLoaded={isLoaded}
			className="rounded-lg">
			<div
				className="flex gap-2"
				style={{ alignItems: description ? 'center' : 'end' }}>
				<Input
					type={isVisible ? 'text' : 'password'}
					label="Squadery Bearer token"
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
						<div className="flex items-center gap-2">
							{isProcessingValue && (
								<Spinner
									color="current"
									className="opacity-75"
									size="sm"
								/>
							)}
							<button
								className="focus:outline-none"
								type="button"
								onClick={() => setIsVisible((prevValue) => !prevValue)}
								aria-label="toggle token visibility">
								{isVisible ? (
									<EyeSlashFilledIcon className="pointer-events-none text-2xl text-default-400" />
								) : (
									<EyeFilledIcon className="pointer-events-none text-2xl text-default-400" />
								)}
							</button>
						</div>
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
