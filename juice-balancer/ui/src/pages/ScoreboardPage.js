import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { defineMessages, injectIntl } from 'react-intl';

import { BodyCard } from '../Components';

const BigBodyCard = styled(BodyCard)`
  width: 60vw;
  max-width: 850px;
`;

const messages = defineMessages({
  tableHeader: {
    id: 'scoreboard_table.table_header',
    defaultMessage: 'Team Scores',
  },
  teamname: {
    id: 'scoreboard_table.teamname',
    defaultMessage: 'Teamname',
  },
  score: {
    id: 'scoreboard_table.score',
    defaultMessage: 'Score',
  },
  noContent: {
    id: 'scoreboard_table.noActiveTeams',
    defaultMessage: 'No teams registered yet!',
  },
});

export default injectIntl(({ intl }) => {
  const [teams, setTeams] = useState([]);

  const { formatMessage } = intl;

  function updateScoreboardData() {
    return axios.get(`/balancer/scoreboard/progress`).then(({ data }) => {
      setTeams(data.teams);
    });
  }

  useEffect(() => {
    updateScoreboardData();

    const interval = setInterval(updateScoreboardData, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const columns = [
    {
      name: formatMessage(messages.teamname),
      selector: 'team',
      sortable: true,
    },
    {
      name: formatMessage(messages.score),
      selector: 'score',
      sortable: true,
      right: true,
    },
  ];

  return (
    <BigBodyCard>
      <h1>Score Board</h1>
      <DataTable
        title={formatMessage(messages.tableHeader)}
        noDataComponent={formatMessage(messages.noContent)}
        defaultSortField="score"
        defaultSortAsc={false}
        columns={columns}
        data={teams}
      />
    </BigBodyCard>
  );
});
