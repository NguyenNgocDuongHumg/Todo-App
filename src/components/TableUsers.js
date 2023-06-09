import { useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import { fetchAllUser } from "../services/UserServices";
import ReactPaginate from "react-paginate";
import ModalAddNew from "./ModalAddNew";
import ModalEditUser from "./ModalEditUser";
import _ from "lodash";
import ModalConfirm from "./ModalComfirm";
import { debounce } from "lodash";
import "./TableUsers.scss";
import { CSVLink } from "react-csv";
import { toast } from "react-toastify";
import Papa from "papaparse";

const TableUsers = (props) => {
  const [listUsers, setListUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [userExport, setUserExport] = useState([]);

  useEffect(() => {
    //call apis
    //dry
    getUsers(1);
  }, []);

  const getUsers = async (page) => {
    let res = await fetchAllUser(page);
    if (res && res.data) {
      // console.log(res);
      setTotalUsers(res.total);
      setTotalPages(res.total_pages);
      setListUsers(res.data);
    }
  };
  // console.log(listUsers);
  const handlePageClick = (event) => {
    console.log(event);
    getUsers(+event.selected + 1);
  };

  const [isCheckModalSHow, setIsCheckModalSHow] = useState(false);
  const [isCheckModalEdit, setIsCheckModalEdit] = useState(false);
  const [isCheckModalConfirm, setIsCheckModalConfirm] = useState(false);
  const [dataUserEdit, setDataUserEdit] = useState({});
  const [dataUserDelete, setDataUserDelete] = useState({});

  const [sortBy, setSortBy] = useState("id");
  const [sortField, setSortField] = useState("asc");

  const handleEditUser = (user) => {
    // console.log(user);
    setDataUserEdit(user);
    setIsCheckModalEdit(true);
  };

  const handleClose = () => {
    setIsCheckModalSHow(false);
    setIsCheckModalEdit(false);
    setIsCheckModalConfirm(false);
  };
  const handleUpdateUser = (user) => {
    setListUsers([user, ...listUsers]);
  };

  const handlePutUpdateUser = (user) => {
    let cloneUser = _.cloneDeep(listUsers);
    let index = listUsers.findIndex((item) => (item.id = user.id));
    cloneUser[index].first_name = user.first_name;
    setListUsers(cloneUser);
  };

  const handleDeleteUser = (user) => {
    setIsCheckModalConfirm(true);
    setDataUserDelete(user);
  };
  const handleDeleteUserFormModal = (user) => {
    let cloneUser = _.cloneDeep(listUsers);
    cloneUser = cloneUser.filter((item) => item.id !== user.id);
    setListUsers(cloneUser);
  };
  const handleSortTable = (sortBy, sortField) => {
    setSortBy(sortBy);
    setSortField(sortField);
    let cloneUser = _.cloneDeep(listUsers);
    cloneUser = _.orderBy(cloneUser, [sortBy], [sortField]);

    setListUsers(cloneUser);
  };

  const handleSearch = debounce((e) => {
    let term = e.target.value;
    if (term) {
      let cloneUser = _.cloneDeep(listUsers);
      cloneUser = cloneUser.filter((item) => item.email.includes(term));
      setListUsers(cloneUser);
    } else {
      getUsers(1);
    }
  }, 500);

  const handleUserExport = (event, done) => {
    let result = [];
    if (listUsers && listUsers.length > 0) {
      result.push(["Id", "Email", "FirstName", "LastName"]);
      listUsers.map((item, index) => {
        let arr = [];
        arr[0] = item.id;
        arr[1] = item.email;
        arr[2] = item.first_name;
        arr[3] = item.last_name;
        result.push(arr);
      });
      setUserExport(result);
      done();
    }
  };

  const handleImport = (event) => {
    if (event && event.target && event.target.files[0]) {
      let file = event.target.files[0];
      if (file.type !== "text/csv") {
        toast.error("Only accpet csv files...");
        return;
      }
      Papa.parse(file, {
        // header: true,
        complete: function (results) {
          let rawCSV = results.data;
          // setListUsers(rawCSV);
          if (rawCSV.length < 1) {
            toast.error("Not found data on CSV file");
          } else {
            if (rawCSV && rawCSV[0].length === 3) {
              if (
                rawCSV[0][0] !== "email" ||
                rawCSV[0][1] !== "first_name" ||
                rawCSV[0][2] !== "last_name"
              ) {
                toast.error("Wrong format CSV file!");
              } else {
                let result = [];
                rawCSV.map((item, index) => {
                  let obj = [];
                  if (index > 0 && item.length === 3) {
                    obj.email = item[0];
                    obj.first_name = item[1];
                    obj.last_name = item[2];
                    result.push(obj);
                  }
                });
                setListUsers(result);
                console.log(result);
              }
            } else {
              toast.error("Wrong format CSV file!");
            }
          }
          console.log("Finished:", results.data);
        },
      });
    }
  };

  return (
    <>
      <div className="my-3 add-new d-sm-flex">
        <span>
          <b>List Users</b>
        </span>
        <div className="group-btns mt-sm-0 mt-2">
          <label htmlFor="import" className="btn btn-warning">
            <i className="fa-solid fa-file-import"></i> Import
          </label>
          <input
            id="import"
            type="file"
            hidden
            onChange={(event) => handleImport(event)}
          />

          <CSVLink
            data={userExport}
            filename={"users.csv"}
            className="btn btn-primary"
            asyncOnClick={true}
            onClick={handleUserExport}
          >
            <i className="fa-solid fa-file-arrow-down"></i> Export
          </CSVLink>
          <button
            className="btn btn-success"
            onClick={() => {
              setIsCheckModalSHow(true);
            }}
          >
            <i className="fa-solid fa-circle-plus"></i> Add new
          </button>
        </div>
      </div>
      <div className="col-12 col-sm-4 my-3">
        <input
          className="form-control"
          placeholder="Search user by email..."
          onChange={(e) => handleSearch(e)}
        />
      </div>
      <div className="custummize-table">
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>
                <div className="sort-header">
                  <span>ID</span>
                  <span>
                    <i
                      className="fa-solid fa-arrow-down-long"
                      onClick={() => handleSortTable("id", "asc")}
                    ></i>
                    <i
                      className="fa-solid fa-arrow-up-long"
                      onClick={() => handleSortTable("id", "desc")}
                    ></i>
                  </span>
                </div>
              </th>
              <th>Email</th>
              <th>
                <div className="sort-header">
                  <span>First Name</span>
                  <span>
                    <i
                      className="fa-solid fa-arrow-down-long"
                      onClick={() => handleSortTable("first_name", "asc")}
                    ></i>
                    <i
                      className="fa-solid fa-arrow-up-long"
                      onClick={() => handleSortTable("first_name", "desc")}
                    ></i>
                  </span>
                </div>
              </th>
              <th>Last Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {listUsers &&
              listUsers.length > 0 &&
              listUsers.map((item, index) => {
                return (
                  <tr key={`users-${index}`}>
                    <td>{item.id}</td>
                    <td>{item.email}</td>
                    <td>{item.first_name}</td>
                    <td>{item.last_name}</td>
                    <td>
                      <button
                        className="btn btn-warning mx-3"
                        onClick={() => {
                          handleEditUser(item);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => {
                          handleDeleteUser(item);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
      </div>
      <ReactPaginate
        breakLabel="..."
        nextLabel="next >"
        onPageChange={handlePageClick}
        pageRangeDisplayed={5}
        pageCount={totalPages}
        previousLabel="< previous"
        renderOnZeroPageCount={null}
        pageClassName="page-item"
        pageLinkClassName="page-link"
        previousClassName="page-item"
        previousLinkClassName="page-link"
        nextClassName="page-item"
        nextLinkClassName="page-link"
        breakClassName="page-item"
        breakLinkClassName="page-link"
        containerClassName="pagination"
        activeClassName="active"
      />
      <ModalAddNew
        show={isCheckModalSHow}
        handleClose={handleClose}
        handleUpdateUser={handleUpdateUser}
      />
      <ModalEditUser
        show={isCheckModalEdit}
        handleClose={handleClose}
        dataUserEdit={dataUserEdit}
        handlePutUpdateUser={handlePutUpdateUser}
      />
      <ModalConfirm
        show={isCheckModalConfirm}
        handleClose={handleClose}
        dataUserDelete={dataUserDelete}
        handleDeleteUserFormModal={handleDeleteUserFormModal}
      />
    </>
  );
};

export default TableUsers;

/* avatar
: 
"https://reqres.in/img/faces/1-image.jpg"
email
: 
"george.bluth@reqres.in"
first_name
: 
"George"
id
: 
1
last_name
: 
"Bluth"*/
