'use server';
import { getMultipleDecryptedCookies } from '@/lib/actions/getMultipleDecryptedCookies';
import { Action, JiraData } from '@/types/types';
import Holidays, { HolidaysTypes } from 'date-holidays';
import { cookies } from 'next/headers';
import JiraClient from 'jira-client';
import moment from 'moment';
import { Worklogs } from './getWorklogs';
import { CalendarDate } from '@nextui-org/react';

export const postSquadery: Action<{}, 'data' | 'dateStart'> = async ({ data, dateStart }) => {
	const cookieRes = await getMultipleDecryptedCookies('squaderySquadId', 'squaderyToken');
		if (cookieRes.status !== 'success') return cookieRes;
		const { squaderySquadId, squaderyToken } = cookieRes.data;
	
	console.log('postSquadery called', JSON.parse(data));
	console.log({ squaderyToken, squaderySquadId })

//FIXME - get the bearer token from the cookies
	const headers = {
		'authority': 'manage-api.squadery.com',
		'accept': '/',
		'accept-language': 'en-US,en;q=0.9',
		'authorization': `Bearer ${squaderyToken}`,
		'content-type': 'application/json',
		'origin': 'https://connect.squadery.com',
		'referer': 'https://connect.squadery.com/',
		'sec-ch-ua': '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
		'sec-ch-ua-mobile': '?0',
		'sec-ch-ua-platform': '"Linux"',
		'sec-fetch-dest': 'empty',
		'sec-fetch-mode': 'cors',
		'sec-fetch-site': 'same-site',
		'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
	}

	try {
		const sendWorklog = async (data: Worklogs, dateStart: string) => {
			// const startDate = moment(dateStart);
			const issueSet = new Set();


			data[0].issues.forEach((issue) => {
				issue.workLogDetails.forEach((worklog) => {
					issueSet.add({
						category: 'Algorithm Development',
						description: `${issue.key} - ${worklog.comment}`,
						minutes: worklog.timeSpentSeconds / 60,
						squadId: squaderySquadId,
						// startTime: moment(worklog.started).toISOString()
					})
				})
			})

			const jiraWorkLogs = Array.from(issueSet);
			// const remainingMinutes = 32400 > data[0].totalTimeSpentSeconds ? 32400 - data[0].totalTimeSpentSeconds : 0;
			// if (remainingMinutes > 0) {
			// 	const meetingWorkLogs = {
			// 		category: 'Meetings',
			// 		description: `Meeting Standup / Discussion with Team members`,
			// 		minutes: remainingMinutes / 60,
			// 		squadId: squaderySquadId,
			// 	}
			// 	jiraWorkLogs.push(meetingWorkLogs);
			// }

			const jsonData = {
				operationName: 'CreateWorklog',
				variables: {
					worklogInput: {
						endDate: new Date(dateStart).toISOString(),
						squadId: squaderySquadId,
						startDate: new Date(dateStart).toISOString(),
						tasks: jiraWorkLogs
					},
				},
				query: `mutation CreateWorklog($worklogInput: NewWorklogDto!) {
					createWorklog(worklogInput: $worklogInput) {
						...WorklogResponseFields
					}
				}

				fragment WorklogResponseFields on WorklogResponseDto {
					id
					squadId
					status
					startDate
					endDate
					reviewedBy
					tasks {
						...TaskResponseFields
					}
				}

				fragment TaskResponseFields on WorklogTaskResponseDto {
					id
					userId
					squadId
					worklogId
					category
					minutes
					description
					startTime
					endTime
				}`,
			};

			console.log({ jsonData })

			try {
				debugger;
				// Make the API request (using fetch or any other method)
				const response = await fetch('https://manage-api.squadery.com/graphql', {
					method: 'POST',
					headers: headers,
					body: JSON.stringify(jsonData),
				});

				const responseData = await response.json();
				debugger;
				console.log(`Response for ${dateStart}: ${response.status}, ${JSON.stringify(responseData)}`);
			} catch (error) {
				console.error(`Error for ${dateStart}:`, error);
				return {
					status: 'error',
					data: error
				};
			}
		};

		await sendWorklog(JSON.parse(data), dateStart)
	
		return {
			status: 'success',
			data: {}
		};
	} catch (e) {
		console.error(e);
		return {
			status: 'error',
			errors: ['Something went wrong']
		};
	}
};
