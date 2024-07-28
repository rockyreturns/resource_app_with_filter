import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import Select from 'react-select';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
// import fs from 'fs';

const CustomFilterModal = ({ show, handleClose, handleSaveAndClose, subscriptions, resourceGroups, handleToggleChange }) => {
  const [uniqueName, setUniqueName] = useState('');
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [selectedResourceGroups, setSelectedResourceGroups] = useState([]);
  const [filters, setFilters] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      const response = await axios.get('/filters.json');
      setFilters(response.data);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const handleSave = async () => {
    if (!uniqueName || !selectedSubscription || selectedResourceGroups.length === 0) {
      setError('Please fill out all fields.');
      return;
    }

    const newFilter = {
      id: uuidv4(),
      name: uniqueName,
      subscription: selectedSubscription,
      resourceGroups: selectedResourceGroups.map(rg => rg.value)
    };

    const updatedFilters = editMode
      ? filters.map(filter => (filter.id === newFilter.id ? newFilter : filter))
      : [...filters, newFilter];

    try {
      // fs.writeFileSync('/filters.json', JSON.stringify(updatedFilters, null, 2));
      setFilters(updatedFilters);
      handleToggleChange();
      handleClose();
    } catch (error) {
      console.error('Error saving filter:', error);
    }
  };

  const handleEdit = filter => {
    setUniqueName(filter.name);
    setSelectedSubscription(filter.subscription);
    setSelectedResourceGroups(filter.resourceGroups.map(rg => ({ value: rg, label: rg })));
    setEditMode(true);
  };

  const handleDelete = async filterId => {
    const updatedFilters = filters.filter(filter => filter.id !== filterId);
    try {
      // fs.writeFileSync('/public/filters.json', JSON.stringify(updatedFilters, null, 2));
      setFilters(updatedFilters);
      handleToggleChange();
    } catch (error) {
      console.error('Error deleting filter:', error);
    }
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Set Custom Filter</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form>
          <Form.Group controlId="uniqueName">
            <Form.Label>Unique Name</Form.Label>
            <Form.Control
              type="text"
              value={uniqueName}
              onChange={e => setUniqueName(e.target.value)}
              readOnly={editMode}
            />
          </Form.Group>
          <Form.Group controlId="subscription">
            <Form.Label>Subscription</Form.Label>
            <Select
              value={selectedSubscription}
              onChange={setSelectedSubscription}
              options={subscriptions.map(sub => ({ value: sub, label: sub }))}
            />
          </Form.Group>
          <Form.Group controlId="resourceGroups">
            <Form.Label>Resource Groups</Form.Label>
            <Select
              isMulti
              value={selectedResourceGroups}
              onChange={setSelectedResourceGroups}
              options={resourceGroups.map(rg => ({ value: rg, label: rg }))}
            />
          </Form.Group>
        </Form>
        <h5>Saved Filters</h5>
        <table className="table">
          <thead>
            <tr>
              <th>Unique Name</th>
              <th>Subscription</th>
              <th>Resource Groups</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filters.map(filter => (
              <tr key={filter.id}>
                <td>{filter.name}</td>
                <td>{filter.subscription}</td>
                <td>{filter.resourceGroups.join(', ')}</td>
                <td>
                  <Button variant="info" onClick={() => handleEdit(filter)}>Edit</Button>
                  <Button variant="danger" onClick={() => handleDelete(filter.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Close</Button>
        <Button variant="primary" onClick={handleSave}>Save</Button>
        <Button variant="success" onClick={() => { handleSave(); handleSaveAndClose(); }}>Save & Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CustomFilterModal;
