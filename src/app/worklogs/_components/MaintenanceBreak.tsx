import {
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from '@nextui-org/react';


export const MaintenanceBreak = () => {
	return (
		<Modal
				isOpen={true}
				placement="center"
				size="2xl"
				className="m-2">
				<ModalContent>
					<>
						<ModalHeader>Maintenance Break</ModalHeader>
						<ModalBody>
                            We are trying to improve our system. Please check back later. <br />
                            Thank you for your patience!
						</ModalBody>
						{/* <ModalFooter>
                            Thank you for your patience!
						</ModalFooter> */}
					</>
				</ModalContent>
			</Modal>
	);
};
