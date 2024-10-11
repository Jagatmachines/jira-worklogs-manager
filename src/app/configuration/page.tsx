import { Card, CardBody, Kbd, CardFooter, Spacer } from '@nextui-org/react';
import { UrlInput } from './_components/UrlInput';
import { UserInput } from './_components/UserInput';
import { TokenInput } from './_components/TokenInput';
import { SquaderySquadId } from './_components/SquaderySquadId';
import { SquaderyTokenInput } from './_components/SquaderyToken';
// import { CountryAutocomplete } from './_components/CountryAutocomplete';

const ConfigurationPage = () => {
	return (
		<Card>
			<CardBody className="flex flex-col gap-4">
				<UrlInput />
				<UserInput />
				<TokenInput />
				<SquaderySquadId />
				<SquaderyTokenInput />
				{/* <CountryAutocomplete /> */}
			</CardBody>
			<CardFooter className="justify-end text-tiny text-default-400">
				Press
				<Spacer />
				<Kbd
					className="text-tiny"
					keys={['enter']}
				/>
				<Spacer />
				to submit a value
			</CardFooter>
		</Card>
	);
};
export default ConfigurationPage;
