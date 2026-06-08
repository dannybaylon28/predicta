export type ApiGame = {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  group: string;
  matchday: string;
  local_date: string;
  stadium_id: string;
  finished: string;
  time_elapsed: string;
  type: string;
  home_team_name_en?: string;
  away_team_name_en?: string;
  home_team_label?: string;
  away_team_label?: string;
};

export type ApiStadium = {
  id: string;
  name_en: string;
  fifa_name: string;
  city_en: string;
  country_en: string;
};

export type ApiTeam = {
  id: string;
  name_en: string;
  fifa_code: string;
  flag: string;
  groups: string;
};
