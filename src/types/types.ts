import { operations } from '@/types/jira.d';

export type JiraData<
	O extends keyof operations,
	// @ts-expect-error
	// TS2344: Type number does not satisfy the constraint keyof operations[O]['responses']
	// Type number is not assignable to type never
	R extends keyof operations[O]['responses'] = 200
	// @ts-expect-error
	// TS2536: Type 'content' cannot be used to index type operations[O]['responses'][R]
	// TS2536: Type 'application/ json' cannot be used to index type operations[O]['responses'][R]['content']
> = operations[O]['responses'][R]['content']['application/json'] & {
	errorMessages?: string[];
	errors?: Record<string, unknown>;
};

export type StandardizedResponse<T> =
	| { data: T; status: 'success' }
	| { errors: (any | JSX.Element)[]; status: 'error' }
	| { status: 'idle' };

export type Action<T, P extends string | number | symbol = string> = (
	payload: Record<P, string>
) => Promise<StandardizedResponse<T>>;
