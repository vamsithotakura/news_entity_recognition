import React, {Component} from 'react';

class DataContainer extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div>
        <h2>{this.props.title}</h2>
        <p>{this.props.body}</p>
      </div>
    )
  }
}

class TableDataContainer extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const doRenderTable = this.props.data.length > 0
    if (doRenderTable) {
      return (
        <div>
          <table>
            <thead>
            <tr>
              <th>Title</th>
              <th>Content</th>
              <th>Link</th>
            </tr>
            </thead>
            <tbody>
            {this.props.data.map((val, index) => {
              return (
                <tr key={index}>
                  <td>{val.title}</td>
                  <td>{val.nerContent}</td>
                  <td>{val.link}</td>
                </tr>
              )
            })}
            </tbody>
          </table>
        </div>
      );
    } else {
      return (
        <div>
          <h3>No results found at this time, please retry later !!</h3>
        </div>
      )
    }

  }
}

class SearchForm extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      search: '',
      showResults: false,
      data: [],
      isLoading: false
    }
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({
      search: event.target.value
    });
  }

  handleSubmit(e) {
    e.preventDefault()
    this.setState(previousState => ({
      ...previousState.items,
      isLoading: true
    }));

    fetch('http://localhost:8080/api/v1/news/articles/query', {
      method: 'POST',
      mode: 'cors',
      body: JSON.stringify({term: this.state.search}),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }).then(async (response) => {
      const responseBody = await response.json()
      console.log(responseBody)
      this.setState(previousState => ({
        ...previousState.items,
        data: responseBody,
        isLoading: false,
        showResults: true,
      }));
    }).catch(error => {
      console.log('Error querying for article data ... \n', error)
      this.setState(previousState => ({
        ...previousState.items,
        isLoading: false,
        data: [],
        showResults: true
      }));
    });
  }

  renderResults() {
    const currData = this.state.data
    return <TableDataContainer data={currData} />
  }

  render() {
    return(
      <div>
        <h1>Welcome to trending article search !!</h1>
        <form onSubmit={this.handleSubmit}>
          <label>
            Query-term :
            <input type="text" value={this.state.search} onChange={this.handleChange} disabled={this.state.isLoading} required/>
          </label>
          <input type="submit" value={this.state.isLoading ? "Loading..." : "Submit"} disabled={this.state.isLoading} />
        </form>
        {this.state.showResults && this.renderResults()}
      </div>
    );
  }
}

export default SearchForm;
