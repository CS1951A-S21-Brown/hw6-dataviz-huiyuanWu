import pandas as pd
import json

def main():
    df = pd.read_csv('./data/football.csv')
    worldcup_years = ['2014', '2018']
    df = df[df['date'].str.split('-', expand=True)[0].isin(worldcup_years)]
    df = df[df['tournament'] == 'FIFA World Cup'];
    src_dst = df[['home_team', 'away_team']]
    src_dst.rename(columns={'home_team': 'source', 'away_team': 'target'}, inplace=True)
    dst_src = df[['away_team', 'home_team']]
    dst_src.rename(columns={'away_team': 'source', 'home_team': 'target'}, inplace=True)
    grouped_src_dst = src_dst.groupby(['source', 'target']).size().reset_index()
    grouped_dst_src = dst_src.groupby(['source', 'target']).size().reset_index()
    country_index = pd.Index(grouped_src_dst['source']
                      .append(grouped_src_dst['target'])
                      .reset_index(drop=True).unique())
    grouped_src_dst.rename(columns={0:'count'}, inplace=True)
    grouped_dst_src.rename(columns={0:'count'}, inplace=True)
    temp_links_list = list(grouped_src_dst.apply(lambda row: {"source": row['source'], "target": row['target'], "value": row['count']}, axis=1))
    temp_links_list.extend(list(grouped_dst_src.apply(lambda row: {"source": row['source'], "target": row['target'], "value": row['count']}, axis=1)))
    links_list = []
    for link in temp_links_list:
        record = {"value":link['value'], "source":country_index.get_loc(link['source']),
        "target": country_index.get_loc(link['target'])}
        links_list.append(record) 
    nodes_list = []
    for c in country_index:
        nodes_list.append( {'name': c, 'id': country_index.get_loc(c)} )

    json_prep = {"nodes": nodes_list, "links": links_list}
    json_dump = json.dumps(json_prep, indent=1, sort_keys=True)
    
    with open('./data/graph3.json', 'w') as f:
        f.write(json_dump)
    
    


if __name__ == '__main__':
    main()
