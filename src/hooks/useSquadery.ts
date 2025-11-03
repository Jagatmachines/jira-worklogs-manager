import { useState, useCallback } from 'react';
import type { JiraAccount } from '../types/jira';

type ApiResponse<T> = {
  status: 'success' | 'error';
  data?: T;
  errors?: any;
};

interface Worklog {
  issues: Array<{
    key: string;
    workLogDetails: Array<{
      comment: string;
      timeSpentSeconds: number;
      started: string;
    }>;
  }>;
  totalTimeSpentSeconds: number;
}

interface WorklogTaskInput {
  category: string;
  description: string;
  minutes: number;
  squadId: string;
}

interface UseSquaderyResult {
  success: boolean;
  failure: boolean;
  message: string | null;
  isLoading: boolean;
  postSquadery: (params: {
    data: string;
    dateStart: string;
    worklogSelection: string;
  }) => Promise<void>;
  clearStatus: () => void;
}

export const useSquaderyNew = (activeAccount: JiraAccount | undefined): UseSquaderyResult => {
  const [success, setSuccess] = useState<boolean>(false);
  const [failure, setFailure] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const postSquadery = useCallback(async ({
    data,
    dateStart,
    worklogSelection
  }: {
    data: string;
    dateStart: string;
    worklogSelection: string;
  }): Promise<void> => {
    try {
      setIsLoading(true);
      setSuccess(false);
      setFailure(false);
      setMessage(null);

      if (!activeAccount?.squaderySquadId || !activeAccount?.squaderyToken) {
        throw new Error('Squadery credentials not configured. Please add them in settings.');
      }

      const { squaderySquadId, squaderyToken } = activeAccount;

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
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      };

      const worklogData = JSON.parse(data) as [Worklog];
      const tasks: WorklogTaskInput[] = [];

      for (const issue of worklogData[0].issues) {
        for (const worklog of issue.workLogDetails) {
          tasks.push({
            category: worklogSelection,
            description: `${issue.key} - ${worklog.comment}`,
            minutes: worklog.timeSpentSeconds / 60,
            squadId: squaderySquadId
          });
        }
      }

      // Calculate remaining minutes (32400 seconds = 9 hours)
      const remainingMinutes = 32400 > worklogData[0].totalTimeSpentSeconds ? 32400 - worklogData[0].totalTimeSpentSeconds : 0;
      if (remainingMinutes > 0) {
        tasks.push({
          category: 'Meetings',
          description: 'Meeting Standup / Discussion with Team members',
          minutes: Math.round(remainingMinutes / 60),
          squadId: squaderySquadId
        });
      }

      const jsonData = {
        operationName: 'CreateWorklog',
        variables: {
          worklogInput: {
            endDate: new Date(dateStart).toISOString(),
            squadId: squaderySquadId,
            startDate: new Date(dateStart).toISOString(),
            tasks
          }
        },
        query: `
          mutation CreateWorklog($worklogInput: NewWorklogDto!) {
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
          }
        `
      };

      const response = await fetch('https://manage-api.squadery.com/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify(jsonData)
      });

      const responseData = await response.json();

      if (response.status === 200 && responseData.data?.createWorklog.status === "PENDING") {
        setSuccess(true);
        setMessage('Synced Done, please check Squadery to verify the success');
      } else {
        throw new Error(responseData.errors?.[0]?.message || 'Failed to create worklog');
      }
    } catch (error) {
      setFailure(true);
      setMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error(`Error for ${dateStart}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [activeAccount]);

  const clearStatus = () => {
    setSuccess(false);
    setFailure(false);
    setMessage(null);
  }

  return {
    success,
    failure,
    message,
    isLoading,
    postSquadery,
    clearStatus
  };
};

export default useSquaderyNew;