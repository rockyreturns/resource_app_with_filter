import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.css';
import AlertMessage from './AlertMessage';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { DataGrid } from '@mui/x-data-grid';
import 'react-datepicker/dist/react-datepicker.css';
import logoTopLeft from './Unilever-Logo.png';
import logoBottom from './company-tansparent.png';
import { Alert, FormControlLabel, Switch } from '@mui/material';
//import CustomFilterModal from './customFilterModal'; // Import the modal component
import UniqueFilterModal from './UniqueFilterModal'; // New modal component
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { jsx } from '@emotion/react';

const App = () => {
  const [alertInfo, setAlertInfo] = useState({ show: false, message: '' });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [costGridData, setCostGridData] = useState([]);
  const [subscription, setSubscription] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [showAlternate, setShowAlternate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState([]);
  const [resourceGroups, setResourceGroups] = useState({}); // Manage resource groups
  const [uniqueModalShow, setUniqueModalShow] = useState(false); // State for UniqueFilterModal
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterChanged, setFilterChanged] = useState(false);
  const [subscriptionValue, setSubscriptionValue]= useState([]);
  const [filterItems, setFilterItems] = useState({});
  const [resourceData, setResourceData] = useState({});
  const effectRan = useRef(false);  

  const handleSaveFilter = (newFilter) => {
        setFilterChanged(true); // Trigger polling    
  };

  const handleDeleteFilter = (filterName) => {
         setFilterChanged(true); // Trigger polling
  };

  useEffect(() => {
    if (effectRan.current === false) {
      const fetchResourceGroups = axios.get('https://func-datalab-resource.azurewebsites.net/api/GetResourceGroups?code=qD0tXBMsJtmG6BdVHihMXO7v-ADh_gY_LsUb0VJ66ThAAzFuXzcUgw==');
      const fetchFilterNames = axios.get('https://jsonserverapp-a3a9dzheexfpgfab.westeurope-01.azurewebsites.net/savedFilters');
 
      Promise.all([fetchResourceGroups, fetchFilterNames])
        .then(([resourceGroupsResponse, filtersResponse]) => {
          const ResourceGroupsData = resourceGroupsResponse.data;
          const filterOptions = filtersResponse.data.map(filter => ({
            value: filter.filterName,
            label: filter.filterName
          }));

          //alert(filtersResponse);

          // Set subscription options
          setSubscription(ResourceGroupsData.map(subs => ({ value: subs.SubscriptionId, label: subs.DisplayName })));
  
          // Set resource groups and default options
          setResourceGroups(ResourceGroupsData);

          // Set filter options from the JSON file
          setFilterItems(filterOptions);
  
          // Set date range
          const oldestDate = ResourceGroupsData[0].ResourceGroups[0].OldestResourceinResourceGroup;
          const newestDate = ResourceGroupsData[0].ResourceGroups[0].NewestResourceinResourceGroup;
          setStartDate(new Date(oldestDate));
          setEndDate(new Date());
        })
        .catch(error => console.error('Error fetching data:', error));
    }
    return () => {
      effectRan.current = true; // Cleanup
    };
  }, []);
  
  
  const handleSubscriptonSelectChange = (selected) => {
    if (selected) {      
      setSelectedSubscription(selected);
      const subscriptionValue = selected.value;
      
      // Find resource groups for the selected subscription
      const subscriptionData = resourceGroups.find(rg => rg.SubscriptionId === subscriptionValue);
      
      if (subscriptionData) {
        // Map resource groups for the selected subscription
        const resourceGroupOptions = subscriptionData.ResourceGroups.map(rg => ({
          value: rg.Name, // Use the correct field name
          label: rg.Name  // Use the correct field name
        }));
        
        // Fetch and map filter options
        axios.get('https://jsonserverapp-a3a9dzheexfpgfab.westeurope-01.azurewebsites.net/savedFilters')
          .then(response => {
            const filterOptions = response.data
              .filter(filter => filter.subscription.value === subscriptionValue)
              .map(filter => ({
                value: filter.filterName,
                label: filter.filterName
              }));
            
            // Merge filter options and resource group options
            setOptions([
              //{ value: 'select_all', label: 'Select All' }, // Select All first
            ...filterOptions,  // Filter names
            ...resourceGroupOptions // Resource groups next
            ]);
          })
          .catch(error => console.error('Error fetching filter names:', error));      
      }
    } 
  };
  
  const handleSelectChange = (selected) => {
    if (selected && selected.some(option => option.value === 'select_all')) {
      if (selected.length === options.length) {
        setSelectedOptions(options.filter(option => option.value !== 'select_all'));
      } else {
        setSelectedOptions([{ value: 'select_all', label: 'Select All' }, ...options.filter(option => option.value !== 'select_all')]);
      }
    } else {
      // Separate selected options into filters and resource groups
      const selectedFilters = selected.filter(option => option.value.startsWith('filter_'));
      const selectedResourceGroups = selected.filter(option => !option.value.startsWith('filter_'));

      // Fetch all filters from your server
      axios.get('https://jsonserverapp-a3a9dzheexfpgfab.westeurope-01.azurewebsites.net/savedFilters')
        .then(response => {
          const filterNames = response.data.map(filter => filter.filterName);      
          
          // Filter out the selected options that are filter names
          const selectedRgs = selected.filter(option => !filterNames.includes(option.value));

          const resourceGroupOptionsFromFilters = selectedFilters.flatMap(filter => {
            const savedFilter = response.data.find(f => f.filterName === filter.value);
            return savedFilter ? savedFilter.resourceGroups.map(rg => ({
              value: rg.label,
              label: rg.label
            })) : [];
          });

          const uniqueResourceGroupOptions = [...resourceGroupOptionsFromFilters, ...selectedResourceGroups]
            .filter((option, index, self) => index === self.findIndex(rg => rg.value === option.value));     

          setSelectedOptions(uniqueResourceGroupOptions);

          const remainingResourceGroups = resourceGroups.flatMap(subscription =>
            subscription.ResourceGroups.map(rg => ({
              value: rg.Name,
              label: rg.Name
            }))
          ).filter(option => !uniqueResourceGroupOptions.some(rg => rg.value === option.value));

          const remainingFilters = response.data
            .filter(filter => !selectedFilters.some(sel => sel.value === filter.filterName))
            .map(filter => ({
              value: filter.filterName,
              label: filter.filterName
            }));

          setOptions([
            { value: 'select_all', label: 'Select All' },
            ...remainingFilters,
            ...remainingResourceGroups
          ]);
        })
        .catch(error => console.error('Error fetching filter data:', error));
    }
  };
  
  
  // Cost and Resource button click.
  const handleCostButtonClick = () => {

    if (selectedSubscription.length === 0) {
      setAlertInfo({ show: true, message: 'Please select a subscription.', variant: 'danger' });
      return;
    }

    if (selectedOptions.length === 0) {
      setAlertInfo({ show: true, message: 'Please select at least one resource group.', variant: 'danger' });
      return;
    }

    if (endDate < startDate) {
      setAlertInfo({ show: true, message: 'End date cannot be earlier than start date.', variant: 'danger' });
      return;
    }

    const selectedItems = selectedOptions.map(option => option.value).filter(value => value !== 'select_all').join(',');
    console.log('Selected Items:', selectedItems); // Log selected items
    var selectedRgForQuery = "";
    //alert(selectedItems);

    //####################################
    // Logic for fetching the RGs using the unique name.

    // Fetch all filters from your server
    axios.get('https://jsonserverapp-a3a9dzheexfpgfab.westeurope-01.azurewebsites.net/savedFilters')
    .then(response => {

      //alert(JSON.stringify(response.data))
      
      // Get all filter names
      //const filterNames = response.data.map(filter => filter.filterName);
      const filterNamesSelected = selectedOptions.filter(option => option.value !== 'select_all').map(option => option.value);
      
      // Fetch data for the selected filters
      const filters = response.data.filter(filter => filterNamesSelected.includes(filter.filterName));
      if (filters.length > 0) {
        const selectedRgNames = selectedItems.split(',');

        // Loop through each item in the input array
        for (let i = 0; i < selectedRgNames.length; i++) {
          var value = selectedRgNames[i].trim(); // Trim whitespace from the item
          var found = false;
          // Check if the item exists in the JSON data
          for (let j = 0; j < response.data.length; j++) {
            if (response.data[j].filterName === value) {   
              found = true;
              if(selectedRgForQuery.length > 0)
              { 
                selectedRgForQuery = selectedRgForQuery + "," + response.data[j].resourceGroups.map(rgs => rgs.value).join(',');                
              }     
              else{
                selectedRgForQuery = response.data[j].resourceGroups.map(rgs => rgs.value).join(',');  
              }  
            }
          }
          if(!found)
          {
            if(selectedRgForQuery.length > 0)
            {
              selectedRgForQuery = selectedRgForQuery + "," + value;              
            }
            else {
              selectedRgForQuery = value;
            }
          }
        }

      } else {
        selectedRgForQuery = selectedItems;
      }
      //####################################  Grid Data
      setLoading(true);
  
      if (showAlternate) {
        axios.get('https://func-datalab-resource.azurewebsites.net/api/GetCostDataWithRetry?code=qD0tXBMsJtmG6BdVHihMXO7v-ADh_gY_LsUb0VJ66ThAAzFuXzcUgw==', {
          params: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            resourceGroupNames: selectedRgForQuery, //selectedItems,
            subscriptionId: selectedSubscription.value
          }
        })
        .then(response => {
          console.log('Cost Data Response:', response.data); // Log the data

          const formattedData = response.data.map((resourceData, index) => ({
            id: index,
            resourceGroupName: resourceData.resourceGroupName,
            name: resourceData.name,
            type: resourceData.type,
            createdTime: resourceData.createdTime,
            totalCost: resourceData.totalCost,
            location: resourceData.location,
            currency: resourceData.currency 
          }));
    
          setCostGridData(formattedData);
    
          //const total = response.data.reduce((total, item) => total + parseFloat(item.cost), 0).toFixed(4);
          const total = response.data.reduce((accumulator, item) => accumulator + item.totalCost, 0);
          setTotalCost("£ " + total.toFixed(2)); // Ensure total is formatted correctly
          setLoading(false);
        })
        .catch(error => {
          setAlertInfo({ show: true, message: 'Failed to retrieve data for ' + selectedItems + '. Please retry after some time.', variant: 'danger' });
          console.error('Error fetching grid data:', error);
          setLoading(false);
        });
      } else {
        axios.get('https://func-datalab-resource.azurewebsites.net/api/GetResourceAndResourceCostWithRetry?code=qD0tXBMsJtmG6BdVHihMXO7v-ADh_gY_LsUb0VJ66ThAAzFuXzcUgw==', {
          params: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            resourceGroupNames: selectedRgForQuery, //selectedItems,
            subscriptionId: selectedSubscription.value
          }
        })
        .then(response => {
          console.log('Resource Data Response:', response.data); // Log the data
          const formattedData = response.data.map((resourceData, index) => ({
            id: index,
            resourceGroupName: resourceData.resourceGroupName,
            name: resourceData.name,
            type: resourceData.type,
            createdTime: resourceData.createdTime,
            totalCost: resourceData.totalCost,
            location: resourceData.location,
            resourceId:resourceData.id
          }));
    
          setGridData(formattedData);
          const total = response.data.reduce((accumulator, item) => accumulator + item.totalCost, 0);
          setTotalCost("£ " + total.toFixed(2)); // Ensure total is formatted correctly
          setLoading(false);
        })
        .catch(error => {
          setAlertInfo({ show: true, message: 'Failed to retrieve data for ' + selectedItems + '. Please retry after some time.', variant: 'danger' });
          console.error('Error fetching grid data:', error);
          setLoading(false);
        });
      }

    });  

  };
  
  const handleToggleChange = (event) => {
    setShowAlternate(event.target.checked);
    setGridData([]);
    setCostGridData([]);
    setTotalCost(0);
  };

  const handleUniqueModalOpen = () => {
    setUniqueModalShow(true);

  };
  const handleCloseModal = () => {
    setUniqueModalShow(false);
    setRefreshKey(prevKey => prevKey + 1); 
  };

  const handleCloseAlert = () => {
    setAlertInfo({ ...alertInfo, show: false });
  };
  
 const costColumns = [
    { field: 'resourceGroupName', headerName: 'RG Name', width: 250 },
    { field: 'name', headerName: 'Service Name', width: 350 },
    { field: 'type', headerName: 'Service Type', width: 300 },
    { field: 'location', headerName: 'Location', width: 200 },
    { field: 'createdTime', headerName: 'Created Time', width: 250 },
    { field: 'totalCost', headerName: 'Cost', width: 500 }
  ];

  const resourceColumns = [
    { field: 'resourceGroupName', headerName: 'RG Name', width: 250 },
    { field: 'name', headerName: 'Service Name', width: 350 },
    { field: 'type', headerName: 'Service Type', width: 300 },
    { field: 'location', headerName: 'Location', width: 200 },
    { field: 'createdTime', headerName: 'Created Time', width: 250 },
    { field: 'totalCost', headerName: 'Cost', width: 250 },
    { field: 'resourceId', headerName: 'Resource Id', width: 500 }
  ];
  const buttonStyle = {
    border: 'none',
    outline: 'none', // Remove default outline
    cursor: 'pointer', // Add cursor pointer for better UX
  };

  return (
   <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '10px', overflow: 'hidden' }}>

      <AlertMessage
        show={alertInfo.show}
        message={alertInfo.message}
        onClose={handleCloseAlert}
      />


      <img src={logoTopLeft} alt="Logo" style={{ position: 'absolute', top: '10px', left: '10px', width: '60px', height: 'auto', zIndex: '100' }} />
      <div className="row text-center my-2" style={{ color: "royalblue" }}>
        <h4>e-Science Resource Data</h4>
      </div>
          <div className="row bg-light" style={{ padding: '5px', borderRadius: '4px' }}>
            <div className="col-8 col-md-8">
                <div className="row">
                  <div className="col-6 col-md-4">
                  <label htmlFor="startDate"><h6>Start Date:</h6></label>
                      <DatePicker
                        selected={startDate}
                        onChange={date => setStartDate(date)}
                        dateFormat="yyyy-MM-dd"
                        className="form-control form-control-sm"
                      />
            </div>
            <div className="col-6 col-md-4">
              <label htmlFor="endDate"><h6>End Date:</h6></label>
              <DatePicker
                selected={endDate}
                onChange={date => setEndDate(date)}
                dateFormat="yyyy-MM-dd"
                className="form-control form-control-sm"
              />
            </div>
            <div className="col-8 col-md-4"> 
                  <FormControlLabel
                      control={<Switch checked={showAlternate} onChange={handleToggleChange} />}
                      label="Toggle Cost View"
                    />
                  </div>
                </div>
                {/* <div class="row">
                  <div class="col-6">.col-6</div>
                  <div class="col-6">.col-6</div>
                </div> */}
            </div>
            <div className="col-4 col-md-4" >
              <div className="row">
                <div className="col-4 col-md-2" >
                    <label htmlFor="totalCost"><h6>Total:</h6></label>                    
                </div>
                <div className="col-8 col-md-6 " >
                    <div className="bg-info text-white text-center" style={{ height: '5vh',  borderRadius: '4px' }}>
                      <h6>{totalCost}</h6>
                    </div>  
                </div>
              </div>
            </div>
          </div>
          {/* Search List */}


     <div className="row bg-light align-items-end" style={{ padding: '5px', borderRadius: '4px' }}>
            <div className="col-8 col-md-8">                 
                <div className="row">  
                  <div className="col-2 col-md-4">   
                        <label htmlFor="selectSubs"><h6>Select Subscription:</h6></label>
                      </div>  
                      <div className="col-10 col-md-8">
                          <Select
                            className="form-control-sm"
                            id="selectSubs"                            
                            options={subscription}
                            value={selectedSubscription}
                            onChange={handleSubscriptonSelectChange}
                           
                            styles={{
                              control: (provided) => ({ ...provided, maxHeight: '40px', overflowY: 'auto' }),
                              menu: (provided) => ({ ...provided, maxHeight: '200px', overflowY: 'auto' })
                            }}
                          />
                  </div>
                </div>
          <div className="row">
            <div className="col-2 col-md-2">
              <label htmlFor="selectItems"><h6>Select Items:</h6></label>
            </div>
            <div className="col-10 col-md-10">
            <Select
                className="form-control-sm"
                id="selectItems"
                isMulti
                value={selectedOptions}
                onChange={handleSelectChange}
                options={options}
                styles={{
                  control: (provided) => ({ ...provided, maxHeight: '40px', overflowY: 'auto' }),
                  menu: (provided) => ({ ...provided, maxHeight: '200px', overflowY: 'auto' })
                }}
              />
            </div>
          </div>
        </div>
        <div className="col-4 col-md-4" style={{ padding: '5px' }}>
          <button onClick={handleCostButtonClick} className="btn btn-primary btn-sm btn-space">Get Filter Data</button>
          <button className="btn btn-sm btn-secondary" onClick={() => setUniqueModalShow(true)}>
            <FontAwesomeIcon icon={faFilter} /> Set Custom Filter
          </button>
        </div>
      </div>

      <div style={{ flex: '1 1 auto', overflow: 'hidden', position: 'relative' }}>
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : showAlternate ? (
          <DataGrid
          rows={costGridData}
          columns={costColumns}
          pageSize={10}
          className="data-grid-custom table"
          rowsPerPageOptions={[10]}
        />
        ) : (
          <DataGrid
          rows={gridData}
          columns={resourceColumns}
          pageSize={10}
          className="data-grid-custom table"
          rowsPerPageOptions={[10]}
        />
        )}
      </div>

      <div style={{ bottom: '10px', right: '20px', textAlign: 'right', fontSize: '0.8em' }}>
        <p style={{ margin: 0, color: "black" }}>Powered by Confluentis Consulting <img src={logoBottom} alt="ConfluentisLogo" style={{ width: '20px', height: 'auto', verticalAlign: 'middle', marginLeft: '5px' }} /></p>
      </div>

      {/* Render UniqueFilterModal */}
      {uniqueModalShow && (
         <UniqueFilterModal
         show={uniqueModalShow}
         onHide={handleCloseModal}
         startDate={startDate}
         endDate={endDate}
         ResourceGroupsData={resourceGroups} 
         onSaveFilter={handleSaveFilter} 
         onDeleteFilter={handleDeleteFilter}
       />
      )}
     

    </div>
  );
};

export default App;
