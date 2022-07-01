module.exports.config = {
  mainnet: {
    dataSources: [],
    templates: []
  },
  "arbitrum-one": {
    dataSources: [],
    templates: []
  },
  celo: {
    dataSources: [],
    templates: []
  },
  kovan: {
    dataSources: [],
    templates: []
  },
  xdai: {
    dataSources: [],
    templates: []
  },
  rinkeby: {
    dataSources: [
      {
        name: "baalSummoner",
        template: "baal-summoner-ds.yaml",
        address: "0x65e6d705e9D73c17aB4E9a8C01653cE7C32B8358",
        startBlock: 10305239
      }
    ],
    templates: [
      {
        name: "baalTemplate",
        template: "baal-template.yaml"
      }
    ]
  },
  matic: {
    dataSources: [],
    templates: []
  }
};
