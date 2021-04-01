const chalk = require('chalk');
const figlet = require('figlet');
const open = require('open');
const shell = require('shelljs');
const cliSelect = require('cli-select');
const prompt = require('prompt-sync')();
const fs = require('fs');
const {Octokit} = require('@octokit/core');

class Comet {
  constructor() {
    this.userData = this.getData;
  }

  async run() {
    console.log(
        chalk.bold.yellowBright(figlet.textSync('Comet', {
          horizontalLayout: 'full',
        })),
        '\n Comet is a cli tool used for managing Phantom owned repositories \n\n Select a repository provider: \n')
    cliSelect({
      values: ['GitHub', 'git.phntms', 'GitLab'],
      valueRenderer: (value, selected) => {
        if (selected) {
          return chalk.underline.green(value);
        }

        return value;
      },
    }).then((response) => {
      switch (response.id) {
        case 0:
          this.github();
          break;
        case 1:
          this.phntms();
        case 2:
          this.gitlab();
          break;
        default:
          break;
      }
    });
  }

  async github() {
    this.userData = this.getData();

    console.log(
        chalk.bold.blueBright('\n ---- You Selected GitHub ---- \n'),
        chalk.green('\n You are now attached to phntms GitHub'));
    this.helpMessage();

    if (this.userData.github) {
      console.log(
          'Comet found an existing key: ',
          chalk.green(this.userData.github.key), '\n');
      this.githubList(this.userData.github.key);
    } else {
      await open('https://github.com/settings/tokens');
      const key = prompt(chalk.green('Please enter your GitHub access key: '));
      this.writeData({github: {key: key}});
    }
  }

  /**
   * Lists all projects from the current provider.
   * @param {key} Github access key
   */
  async githubList(key) {
    const octokit = new Octokit({auth: key});

    const response = await octokit.request('GET /orgs/phantomstudios/repos', {
      org: 'phantomstudios',
    });

    cliSelect({
      values: response.data,
      valueRenderer: (value, selected) => {
        if (selected) {
          return chalk.underline.green(value.name);
        }
        return value.name;
      },
    }).then((response) => {
      shell.exec(
          'git clone https://github.com/phantomstudios/' + response.value.name);
      shell.exec('cd ./' + response.value.name);
    });
  }

  phntms() {}

  gitlab() {}

  /**
   * Gets the users existing configuration from the config file or returns an
   * empty array if there is not an existing config.
   */
  getData() {
    let data = fs.readFileSync('./config.json'), user;

    try {
      user = JSON.parse(data);
      console.dir(user.github);
      return user;
    } catch (err) {
      console.log(chalk.red('There has been an error parsing your JSON.'))
      console.log(err);
      return {};
    }
  }

  /**
   * Writes a user account information to the config file
   * @param acoount: An array containing account data for the given repo host.
   */
  writeData(account) {
    const data = JSON.stringify(account);

    fs.writeFile('./config.json', data, function(err) {
      if (err) {
        console.log('There has been an error saving your configuration data.');
        console.log(err.message);
        return;
      }
      console.log('\nConfiguration saved successfully.')
    });
  }

  helpMessage() {
    console.log(
        ' Run ', chalk.blueBright('comet -h'),
        ' to see all available commands \n');
  }
}

const comet = new Comet;
comet.run();
