'use server';
import { getMultipleDecryptedCookies } from '@/lib/actions/getMultipleDecryptedCookies';
import { Action, JiraData } from '@/types/types';
import Holidays, { HolidaysTypes } from 'date-holidays';
import { cookies } from 'next/headers';
import JiraClient from 'jira-client';
import moment from 'moment';

export interface WorklogDetails {
	self:             string;
	author:           any[];
	updateAuthor:     any[];
	comment:          string;
	created:          string;
	updated:          string;
	started:          string;
	timeSpent:        string;
	timeSpentSeconds: number;
	id:               string;
	issueId:          string;
}

export interface Issue {
	key: string;
	url: string;
	name: unknown;
	description: unknown;
	workLogDetails: WorklogDetails[]
}

export type Worklogs = {
	date: string;
	isHoliday: false | HolidaysTypes.Holiday[];
	totalTimeSpentSeconds: number;
	issues: Issue[];
}[];

const API_VERSION = process.env.API_VERSION;
if (typeof API_VERSION === 'undefined') throw new Error('Missing API_VERSION env variable');

export const getWorklogs: Action<Worklogs, 'dateStart' | 'dateEnd'> = async ({ dateStart, dateEnd }) => {
	try {
		const cookieRes = await getMultipleDecryptedCookies('url', 'user', 'token');

		if (cookieRes.status !== 'success') return cookieRes;
		const { url, user, token } = cookieRes.data;
		console.log({ user })


		const jira = new JiraClient({
			protocol: 'https',
			host: url,
			username: user,
			password: token,
			apiVersion: '2',
			strictSSL: true,
		  });

		const userDetals = await jira.getCurrentUser();
		const currentUserAccountId = userDetals.accountId;

		let startAt = 0;
		const issuesBuffer: NonNullable<JiraData<'searchForIssuesUsingJql'>['issues']> = [];

		// const defaultStartDate = moment().startOf('month').format('YYYY-MM-DD');
		const defaultStartDate = moment(dateStart).format('YYYY-MM-DD');
		const defaultEndDate = moment(dateEnd).format('YYYY-MM-DD');

		while (true) {
			// const jqlQuery = `worklogAuthor = "${user}" AND worklogDate >= "${defaultStartDate}" AND worklogDate <= "${defaultEndDate}&startAt=${startAt}"`;
			const jqlQuery = `worklogAuthor = "${user}" AND worklogDate >= "${defaultStartDate}" AND worklogDate <= "${defaultEndDate}"`;
			const issuesJson = await jira.searchJira(jqlQuery, { maxResults: 1000, startAt });

			const issues = issuesJson.issues ?? [];

			// console.log({ issuesJson, issues })

			issuesBuffer.push(...issues);

			startAt += issues.length;
			if (startAt >= (issuesJson.total ?? 0)) break;
		}

		const worklogsBufferErrors: (string | JSX.Element)[] = [];
		const worklogsBuffer = await Promise.all(
			issuesBuffer.map(async (issue) => {
				if (worklogsBufferErrors.length || !issue.key) return;

				// this call should accept query params to filter the results by date and pagination
				// (https://developer.atlassian.com/cloud/jira/platform/rest/v2/api-group-issue-worklogs/#api-rest-api-2-issue-issueidorkey-worklog-get)
				// however it does not seem to work
				// const worklogsRes = await fetch(`https://${url}/rest/api/${API_VERSION}/issue/${issue.key}/worklog`, {
				// 	headers: { Authorization: `Bearer ${token}` }
				// });

				// const worklogsRes =

				// const issuesJson = await jira.searchJira(jqlQuery, { maxResults: 1000 });

				// const worklogsJson: JiraData<'getIssueWorklog'> = await worklogsRes.json();

				const worklogsJson = await jira.getIssueWorklogs(issue.key);

				// console.log({ worklogsJson, worklogs: worklogsJson.worklogs })
				// if (!worklogsRes.ok) worklogsBufferErrors.push(...(worklogsJson.errorMessages ?? []));
				if ((worklogsJson.maxResults ?? 0) < (worklogsJson.total ?? 0)) {
					worklogsBufferErrors.push(
						<p>
							Issue <strong>{issue.key}</strong> has more than <strong>{worklogsJson.maxResults}</strong>{' '}
							worklogs. Some data will be missing.
						</p>
					);
				}

				return worklogsJson.worklogs;
			})
		);
		if (worklogsBufferErrors.length) return { status: 'error', errors: worklogsBufferErrors };

		const worklogsBufferFilteredByAuthorAndDates = worklogsBuffer.flat().filter((w) => {
			if (!w?.author || !w.started) {
				// console.log('here returniing false 1', w)
				return false;
			}
			if (w.author.accountId !== currentUserAccountId) {
				// console.log({ currentUserAccountId })
				// console.log('here returniing false 2', w)
				return false;
			}
			if (new Date(w.started).getTime() < new Date(dateStart).setHours(0)) {
				// console.log('here returniing false 3', w)
				return false;
			}
			// noinspection RedundantIfStatementJS
			if (new Date(w.started).getTime() > new Date(dateEnd).setHours(23, 59, 59, 999)) {
				// console.log('here returniing false 4', w);
				return false;
			}
			return true;
		});

		const finalWorklogs: Worklogs = [];
		const firstDate = new Date(dateStart);
		const lastDate = new Date(dateEnd);
		const holidays = new Holidays(cookies().get('holidayCountry')?.value ?? '');
		let currentDate = firstDate;
		if (firstDate > lastDate) {
			return { status: 'error', errors: ['Start date cannot be after end date.'] };
		} else {
			while (currentDate <= lastDate) {
				const currentDateWorklogs: WorklogDetails[] = worklogsBufferFilteredByAuthorAndDates.filter((w) => {
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
					issues: Array.from(relatedIssuesSet).map((i) => {
						return ({
							key: i.key ?? '',
							url: `https://${url}/browse/${i.key}`,
							name: i.fields?.summary,
							description: i.fields?.description,
							workLogDetails: currentDateWorklogs.filter((w) => {
								if (!w?.issueId) return false;
								return i.id === w.issueId
							}),
						})
					})
				});
				currentDate.setDate(currentDate.getDate() + 1);
			}
		}

		// console.log({ finalWorklogs })

		return {
			status: 'success',
			data: finalWorklogs
		};
	} catch (e) {
		console.error(e);
		return {
			status: 'error',
			errors: ['Something went wrong']
		};
	}
};
