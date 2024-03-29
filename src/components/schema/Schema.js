import React, { Component } from "react";
import Form from "react-jsonschema-form";
import brace from 'brace';
import AceEditor from 'react-ace';
import 'brace/mode/json';
import 'brace/theme/github';
import Api from "../../api";
import { Link } from "react-router-dom";

export default class Schema extends Component {

  state = {
    schema: {},
    props_text: "",
    schema_enlarged: {},
    patched_schema:{},
    isAdd: false
  };

  componentDidMount = async () => {
    const schemaId = this.props.match.params.schemaId;
    if(schemaId === "_addNew") {
      const schema = {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
      }
      };
      const patched_schema = Api.getPatchSchema(schema);
      this.setState({ props_text:"{}",isAdd:true,schema:schema,schema_enlarged: patched_schema, patched_schema: patched_schema});
    }
    else if(window.location.href.endsWith("_addNew") ) {
      const schema = {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "$ref": schemaId,
      "properties": {}
      };
      const {data} = await Api.get(`/schema/${schemaId}`);

      const axis_schema = await Api.get(`/schema/${schemaId}?enlarged`);
      var schema_enlarged = axis_schema.data;
      schema_enlarged["$ref"]= "#/definitions/"+schemaId;
      if(schema_enlarged.definitions === undefined) {
        schema_enlarged.definitions = {};
      }
      delete data.title;
      delete data.description;
      delete data["$id"];
      let cdata = Object.assign({}, data);
      if(cdata["$ref"] != undefined && cdata["$ref"] !== data["$id"]) {
        cdata["$ref"] = "#/definitions/"+cdata["$ref"];
      }
      schema_enlarged.definitions[schemaId] = cdata;

      data["$ref"] = schemaId;
      data.properties = {};

      //console.log(schema_enlarged);
      const patched_schema = Api.getPatchSchema(schema_enlarged);
      //console.log(patched_schema);
      this.setState({ props_text:"{}",isAdd:true, schema:data,schema_enlarged: schema_enlarged,patched_schema: patched_schema});
    }
    else {
      const axis_schema = await Api.get(`/schema/${schemaId}?enlarged`);
      var schema_enlarged = axis_schema.data;
      const patched_schema = Api.getPatchSchema(schema_enlarged);
      const {data} = await Api.get(`/schema/${schemaId}`);
      this.setState({ props_text:JSON.stringify(data.properties, undefined, 2), isAdd:false, schema:data,schema_enlarged: schema_enlarged,patched_schema: patched_schema});
    }
  };

  onSubmit = (e) => {
    e.preventDefault();
    const schemaId = this.props.match.params.schemaId;
    if(this.state.isAdd === true) {


      if(this.state.patched_schema.properties.hasOwnProperty("id")) {
        this.state.schema.ids = ["id"];
      }

      if(this.state.patched_schema.properties.hasOwnProperty("name")) {
        this.state.schema.labelField = "name";
      } else if(this.state.patched_schema.properties.hasOwnProperty("title")) {
        this.state.schema.labelField = "title";
      }

      Api.post(`/schema`,this.state.schema)
      .then(function (response) {
        window.location = '/';

      })
      .catch(function (error) {
        console.log(error);
      });
    }
    else {
      const updated_data = Api.put(`/schema/${schemaId}`,this.state.schema)
      .then(function (response) {
        console.log(response);
        window.location = '/';
      })
      .catch(function (error) {
        console.log(error);
      });
    }
  };

  onChange = (jsondata) => {
    console.log(jsondata);
    try {
      let props = JSON.parse(jsondata);
      console.log("ss",props);
      this.state.schema.properties = props;
      this.state.schema_enlarged.properties = props;
      this.setState({ patched_schema: Api.getPatchSchema(this.state.schema_enlarged)});
      } catch (e) {
        console.log(false);
      }
      this.setState({ props_text: jsondata});
  };

  onCancel = (e) => {
    e.preventDefault()
    window.location = '/';
  };

  handleChange = (event) => {
    this.state.schema[event.target.name] = event.target.value;
    let schema = this.state.schema;
    this.setState({ schema: {}});
    this.setState({ schema: schema});
  }

  render() {
    const isAdd = this.state.isAdd;
    let idText;
    if (isAdd) {
        idText =
        <React.Fragment>
        <input type="text" className="form-control" type="text" name="$id" value={this.state.schema["$id"]} onChange={this.handleChange} placeholder="Id"/>
        <label className="form-check-label" for="title">
          &nbsp;&nbsp;&nbsp;&nbsp; with title &nbsp;&nbsp;&nbsp;&nbsp;
        </label>
        </React.Fragment>
      }
    let refText;
    if(this.state.schema["$ref"] != undefined) {
      refText = <label className="form-check-label">
      &nbsp;&nbsp;&nbsp;&nbsp; which extends <a href={`/schema/`+this.state.schema['$ref']}>{this.state.schema['$ref']}</a>
      </label>
    }
    return (
      <React.Fragment>
          <header className="row">
              <div className="col-md-12">
              <form className="form-inline" autocomplete="off">
              
              {idText}
                  <input className="form-control" type="text" name="title" value={this.state.schema.title} onChange={this.handleChange} placeholder="Title"/>
                  <label className="form-check-label" for="title">
                    &nbsp;&nbsp;&nbsp;&nbsp; described as &nbsp;&nbsp;&nbsp;&nbsp;
                  </label>
                  <input  className="form-control" type="text" name="description" value={this.state.schema.description} onChange={this.handleChange} placeholder="Description"/>
                  {refText}
                  <input className="form-control pull-right" style={{width: '40%'}} type="text" name="dsl" placeholder="Field DSL"/>
              </form>
              </div>
          </header>
          <div className="row">
              
              <div className="col-md-7">
                <Form schema={this.state.patched_schema} onSubmit={this.onSubmit} FieldTemplate={Api.Tpl}>
                <div></div>
                </Form>
              </div>
              <div className="col-md-5">
              <AceEditor
                mode="json"
                theme="github"
                value={this.state.props_text}
                onChange={this.onChange}
                name="UNIQUE_ID_OF_DIV"
                editorProps={{$blockScrolling: true}}
              />
              </div>
          </div>

              <footer className="container-fluid">
              <div className="row">
                  <div className="col-md-12 text-right">
                <button className="btn btn-link" type="button" onClick={this.onCancel} >Cancel</button>
                <button className="btn btn-primary" type="submit" onClick={this.onSubmit}>Submit</button>
              </div>
              </div>
              </footer>

      </React.Fragment>

    );
  }
}
