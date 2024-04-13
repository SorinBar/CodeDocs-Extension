
function AddUser() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [verified, setVerified] = useState<boolean | null>(null);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (name == "") {
      setError("Name is mandatory");
      return;
    }
    if (email == "") {
      setError("Email s mandatory");
      return;
    }
    if (verified == null) {
      setError("Verified is mandatory");
      return;
    }
    const res = await UserHandler.createUser(name, email, verified);
    if (!res) {
      setError("Unexpected error, please try again later");
      return;
    }
    if (!res.success) {
      console.log(res);
      setError(res.msg || "");
      return;
    }

    alert("User created successfully!");
    navigate("/dashboard");
  };

  return (
    <div className="add-user">
      <div className="header-all">User management system</div>
      <div className="header">Add user</div>
      <div className="add-user-container">
        <form className="add-user-form">
          <div className="form-group">
            <label>Name</label>
            <input
              id="name"
              name="name"
              placeholder="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              id="email"
              name="email"
              placeholder="email"
              type="text"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Verified</label>
            <div className="radio-button-container">
              <input
                name="verified"
                type="radio"
                value="true"
                onClick={() => setVerified(true)}
              />
              True
            </div>
            <div className="radio-button-container">
              <input
                name="verified"
                type="radio"
                value="false"
                onClick={() => setVerified(false)}
              />
              False
            </div>
          </div>
          <div className="submit">
            <button onClick={handleSubmit}>Add user</button>
          </div>
          {error != "" ? <div className="error-alert">{error}</div> : <></>}
        </form>
      </div>
    </div>
  );
}

function Dashboard() {
  const [users, setUsers] = useState<Array<User> | null>(null);
  const navigate = useNavigate();

  const getAllUsers = async () => {
    const res = await UserHandler.getUsers();
    if (!res || !res.success) {
      console.log("error at fetching users");
      return;
    }
    setUsers(res.users || null);

    console.log(res.users);
  };

  const deleteUser = async (email: string) => {
    const res = await UserHandler.deleteUser(email);
    if (!res || !res.success) {
      alert("There was an error at deleting the user, please try again later");
      return;
    }
    if (users != null) {
      const newUsers = users.filter((element) => {
        return element.email != email;
      });
      setUsers([...newUsers]);
    }
  };

  const handleSubmit = async (event: any, email: string) => {
    event.preventDefault();
    var answer = window.confirm("Are you sure you want to delete this user?");
    if (answer) {
      await deleteUser(email);
    } else {
      console.log("we dont delete the user");
      return;
    }
  };

  const handleNavigate = (event: any) => {
    event.preventDefault();
    navigate("/addUser");
  };

  useEffect(() => {
    if (!users) {
      getAllUsers();
    }
  }, [users]);
  return !users ? (
    <PacmanLoader color="#ffe4c4" className="loader" />
  ) : (
    <div className="dashboard">
      <div className="header-all">Users management system</div>
      <div className="header">All users</div>
      {users.length !== 0 ? (
        <div className="users-container">
          {users.map((element) => {
            return (
              <div className="user" key={element.userId}>
                <div>Name : {element.name}</div>
                <div>Email : {element.email}</div>
                <div>Verified : {element.verified.toString()}</div>
                <div>
                  <button
                    onClick={() => navigate("/editUser/" + element.email)}
                  >
                    Edit
                  </button>
                </div>
                <div>
                  <button
                    onClick={(event) => handleSubmit(event, element.email)}
                  >
                    Delete{" "}
                  </button>
                </div>
              </div>
            );
          })}
          <button onClick={handleNavigate}>Add User</button>
        </div>
      ) : (
        <div className="users-container">
          <div>No users availabale</div>
          <button onClick={handleNavigate}>Add User</button>
        </div>
      )}
    </div>
  );
}


function EditUser() {
  const navigate = useNavigate();
  const params = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState<string>("");
  const [verified, setVerified] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  const getUser = async (email: string) => {
    const res = await UserHandler.getUserByEmail(email);
    if (!res || !res.success) {
      navigate("/dashboard");
      return;
    }
    setName(res.user!.name);
    setVerified(res.user!.verified);
    setUser(res.user!);
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (name == "") {
      setError("Name is mandatory");
      return;
    }
    if (verified == null) {
      setError("Verified is mandatory");
      return;
    }
    const newUser = {
      userId: user!.userId,
      email: user!.email,
      name: name,
      verified: verified,
    };
    const res = await UserHandler.updateUser(user!.email, newUser);
    if (!res) {
      setError("Unexpected error, please try again later");
      return;
    }
    if (!res.success) {
      setError(res.msg || "");
      return;
    }

    alert("User updated successfully!");
    navigate("/dashboard");
  };
  useEffect(() => {
    if (!user && params) {
      getUser(params.email || "");
    }
  }, [user, params]);

  return user ? (
    <div className="edit-user">
      <div className="header-all">User management system</div>
      <div className="header">Edit user</div>
      <div className="edit-user-container">
        <form className="edit-user-form">
          <div className="form-group">
            <label>Email</label>
            <div>{user.email}</div>
          </div>
          <div className="form-group">
            <label>Name</label>
            <input
              id="name"
              name="name"
              placeholder="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Verified</label>
            <div className="radio-button-container">
              <input
                name="verified"
                type="radio"
                value="true"
                defaultChecked={verified == true}
                onClick={() => setVerified(true)}
              />
              True
            </div>
            <div className="radio-button-container">
              <input
                name="verified"
                type="radio"
                value="false"
                defaultChecked={!verified == true}
                onClick={() => setVerified(false)}
              />
              False
            </div>
          </div>
          <div className="submit">
            <button onClick={handleSubmit}>Edit user</button>
          </div>
          {error != "" ? <div className="error-alert">{error}</div> : <></>}
        </form>
      </div>
    </div>
  ) : (
    <PacmanLoader color="#ffe4c4" className="loader" />
  );
}