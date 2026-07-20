const config = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      headerPattern:
        /^(?:(?:[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]\uFE0F?)\s)?(\w*)(?:\(([\w$./-]*)\))?!?: (.*)$/u,
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
};

export default config;
