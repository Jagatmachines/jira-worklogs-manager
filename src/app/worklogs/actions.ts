'use server';
import { getMultipleDecryptedCookies } from '@/lib/actions';
import { Action, JiraData } from '@/types/types';
import Holidays, { HolidaysTypes } from 'date-holidays';
import { cookies } from 'next/headers';

export type Worklogs = {
	date: string;
	isHoliday: false | HolidaysTypes.Holiday[];
	totalTimeSpentSeconds: number;
	issues: {
		key: string;
		url: string;
		name: unknown;
		description: unknown;
	}[];
}[];
// TODO: replace with one action fetching all the data
// set this based on table row data, then return the new data, then convert them to html on client page, then remove functions above
// next refactor config page cuz of new return types and useAction hooks instead of useState
export const getWorklogs: Action<Worklogs, 'dateStart' | 'dateEnd'> = async ({ dateStart, dateEnd }) => {
	try {
		// TODO: return errors if length
		const errors: string[] = [];

		const cookieRes = await getMultipleDecryptedCookies('url', 'user', 'token');
		if (cookieRes.status !== 'success') return cookieRes;
		const { url, user, token } = cookieRes.data;

		let startAt = 0;
		const issuesBuffer: Required<JiraData<'searchForIssuesUsingJql'>['issues']> = [];
		while (true) {
			const issuesRes = await fetch(
				`https://${url}/rest/api/2/search?jql=worklogAuthor = "${user}" AND worklogDate >= ${dateStart} AND worklogDate <= ${dateEnd}&startAt=${startAt}`,
				{
					headers: { Authorization: `Bearer ${token}` }
				}
			);
			const issuesJson: JiraData<'searchForIssuesUsingJql'> = await issuesRes.json();
			if (!issuesRes.ok) {
				errors.push(...(issuesJson.errorMessages ?? []));
				break;
			}
			const issues = issuesJson.issues ?? [];
			issuesBuffer.push(...issues);

			startAt += issues.length;
			if (startAt >= (issuesJson.total ?? 0)) break;
		}

		const worklogsBuffer = await Promise.all(
			issuesBuffer.map(async (issue) => {
				if (errors.length) return;

				// this call should accept query params to filter the results by date and pagination
				// (https://developer.atlassian.com/cloud/jira/platform/rest/v2/api-group-issue-worklogs/#api-rest-api-2-issue-issueidorkey-worklog-get)
				// however it does not seem to work
				const worklogsRes = await fetch(`https://${url}/rest/api/2/issue/${issue.key}/worklog`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				const worklogsJson: JiraData<'getIssueWorklog'> = await worklogsRes.json();
				if (!worklogsRes.ok) errors.push(...(worklogsJson.errorMessages ?? []));
				if ((worklogsJson.maxResults ?? 0) < (worklogsJson.total ?? 0))
					errors.push(
						`Issue ${issue.key} has more than ${worklogsJson.maxResults} worklogs. Some data will be missing.`
					);

				return worklogsJson.worklogs;
			})
		);

		const worklogsBufferFilteredByAuthorAndDates = worklogsBuffer.flat().filter((w) => {
			if (!w?.author || !w.started) return false;
			if (w.author.name !== user) return false;
			if (new Date(w.started).getDate() < new Date(dateStart).getDate()) return false;
			if (new Date(w.started).getDate() > new Date(dateEnd).getDate()) return false;
			return true;
		});

		console.log(worklogsBuffer);

		//TODO: set type
		const finalWorklogs: Worklogs = [];
		const firstDate = new Date(dateStart);
		const lastDate = new Date(dateEnd);
		const holidays = new Holidays(cookies().get('holidayCountry')?.value ?? '');
		let currentDate = firstDate;
		if (firstDate > lastDate) {
			errors.push('Start date cannot be after end date.');
		} else {
			while (currentDate <= lastDate) {
				const currentDateWorklogs = worklogsBufferFilteredByAuthorAndDates.filter((w) => {
					if (!w?.started) return false;
					return new Date(w.started).toDateString() === currentDate.toDateString();
				});

				const relatedIssuesSet = new Set<(typeof issuesBuffer)[number]>();
				currentDateWorklogs.forEach((w) => {
					if (!w?.issueId) return;
					const relatedIssue = issuesBuffer.find((i) => i.id === w.issueId);
					if (!relatedIssue) return;
					relatedIssuesSet.add(relatedIssue);
				});

				finalWorklogs.push({
					date: currentDate.toISOString(),
					isHoliday: holidays.isHoliday(currentDate),
					totalTimeSpentSeconds: currentDateWorklogs.reduce((acc, w) => acc + (w?.timeSpentSeconds ?? 0), 0),
					issues: Array.from(relatedIssuesSet).map((i) => ({
						key: i.key ?? '',
						url: `https://${url}/browse/${i.key}`,
						name: i.fields?.summary,
						description: i.fields?.description
					}))
				});
				currentDate.setDate(currentDate.getDate() + 1);
			}
		}

		return {
			status: 'success',
			data: finalWorklogs
		};
	} catch (e) {
		console.error(e);
		return {
			status: 'error',
			errors: ['Unexpected error occurred while getting worklogs']
		};
	}
};

export const logWork: Action<'success', 'issueKeyOrId' | 'date' | 'timeSpentSeconds'> = async ({
	issueKeyOrId,
	date,
	timeSpentSeconds
}) => {
	const cookieRes = await getMultipleDecryptedCookies('url', 'token');
	if (cookieRes.status !== 'success') return cookieRes;
	const { url, token } = cookieRes.data;

	const address = `https://${url}/rest/api/2/issue/${issueKeyOrId}/worklog`;
	const config = {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			timeSpentSeconds,
			started: new Date(date).toISOString().replace('Z', '-0500')
		})
	};

	const res = await fetch(address, config);
	const json: JiraData<'addWorklog'> = await res.json();
	console.log(json);

	if (!res.ok) return { status: 'error', errors: json.errorMessages ?? [] };
	return { status: 'success', data: 'success' };
};
