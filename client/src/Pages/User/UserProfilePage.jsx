import axios from "axios";
import {
  Card,
  Spinner,
  TextInput,
  Label,
  Button,
  Avatar,
  Select,
} from "flowbite-react";
import { FaCheck } from "react-icons/fa";
import ToastMsg from "../../Components/Other/ToastMsg";
import { getData } from "country-list";
import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { inputTheme, spinnerTheme } from "../../Components/theme";
import { AuthContext } from "../../Components/Authentication/AuthContext";

function UserProfilePage() {
  const { user, setUser } = useContext(AuthContext);
  const fileinputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [changedLoading, setChangedLoading] = useState(false);
  const [changed, setChanged] = useState(false);
  const [successUpdate, setSuccessUpdate] = useState(false);
  const [data, setData] = useState();
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const navigate = useNavigate();

  const cardTheme = {
    root: {
      base: "flex rounded-lg border border-gray-200 bg-white shadow-sm",
      children: "flex flex-wrap h-full flex-col justify-center gap-4",
    },
  };

  useEffect(() => {
    axios
      .get("/api/profile/view-profile")
      .then((res) => {
        if (res.status === 200) {
          setData(res.data);
        }
      })
      .catch((err) => {
        if (err.response.status === 401) {
          navigate("/login");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const submitGeneralInfoChange = (e) => {
    e.preventDefault();
    setChangedLoading(true);
    setFirstNameError('');
    setLastNameError('');
    setPhoneError('');
    const firstName = e.target.first_name.value.trim();
    const formData = {
      name: `${firstName} ${e.target.last_name.value.trim()}`,
      country: e.target.country.value,
      phone: e.target.phone.value.trim(),
    };

    axios
      .patch("/api/profile/update-account", formData)
      .then(async (res) => {
        if (res.status === 200) {
          setChanged(false);
          setSuccessUpdate(true);
          await axios.get("/api/auth/whoami").then((res) => {
            setUser(res.data);
          });
        }
      })
      .catch((err) => {
        if (err.response.status === 401) {
          navigate("/login");
        } else if (err.response.status === 400) {
          const errorMessage = err.response.data.detail;
          if (errorMessage.includes("First name cannot be empty")) {
            setFirstNameError(errorMessage);
          } else if (errorMessage.includes("First name must be 10 characters or fewer")) {
            setFirstNameError(errorMessage);
          } else if (errorMessage.includes("Last name must be 10 characters or fewer")) {
            setLastNameError(errorMessage);
          } else if (errorMessage.includes("Phone number must be 13 characters or fewer")) {
            setPhoneError(errorMessage);
          } else if (errorMessage.includes("Phone number cannot contain special character")) {
            setPhoneError(errorMessage);
          }
        }
      })
      .finally(() => {
        setChangedLoading(false);
      });
  };

  const updateProfilePict = (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      axios
        .patch("/api/profile/update-profile-pict", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => {
          if (res.status === 200) {
            setSuccessUpdate(true);
            axios.get("/api/auth/whoami").then((res) => {
              setUser(res.data);
            });
          }
        })
        .catch((err) => {
          if (err.response.status === 401) {
            navigate("/login");
          }
        });
    }
  }

  return (
    <>
      {loading ? (
        <div className="mt-28 flex items-center justify-center">
          <Spinner theme={spinnerTheme} />
        </div>
      ) : (
        <div className="mt-20 p-6">
          <ToastMsg
            color="green"
            icon={<FaCheck className="h-5 w-5" />}
            open={successUpdate}
            setOpen={setSuccessUpdate}
            message="Your profile has been updated"
          />
          <div className="flex flex-col md:flex-row md:flex-nowrap gap-6">
            <Card className="p-6 w-full md:w-fit min-w-80" theme={cardTheme}>
              <Avatar referrerPolicy="no-referrer" img={`${user.profile_pict}?${Date.now()}`} size="xl" />
              <div className="flex flex-col gap-1 mt-2">
                <span className="text-xl font-bold">{user.name}</span>
                <span className="text-gray-500">{data.email}</span>
              </div>
              <Button className="bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-800" onClick={()=>fileinputRef.current.click()}>Change picture</Button>
              <input
                ref={fileinputRef}
                type="file"
                accept=".png,.jpg,.jpeg"
                style={{ display: "none" }}
                onChange={updateProfilePict}
              />
            </Card>
            <Card className="p-6 w-full" theme={cardTheme}>
              <h2 className="text-xl font-bold">General Information</h2>
              <form
                onSubmit={submitGeneralInfoChange}
                onChange={() => setChanged(true)}
              >
                <div className="grid gap-5 md:grid-cols-2 sm:grid-cols-1">
                  <div>
                    <div className="mb-2 block">
                      <Label htmlFor="first_name" value="First name" />
                    </div>
                    <TextInput
                      id="first_name"
                      name="first_name"
                      type="text"
                      pattern="^[a-zA-Z]*$"
                      required={true}
                      defaultValue={data.first_name}
                      shadow={true}
                      theme={inputTheme}
                      color={firstNameError ? 'failure' : undefined}
                      helperText={firstNameError ? <span className="text-red-500">{firstNameError}</span> : undefined}
                    />
                  </div>
                  <div>
                    <div className="mb-2 block">
                      <Label htmlFor="last_name" value="Last name" />
                    </div>
                    <TextInput
                      id="last_name"
                      name="last_name"
                      type="text"
                      pattern="^[a-zA-Z]*$"
                      defaultValue={data.last_name}
                      shadow={true}
                      theme={inputTheme}
                      color={lastNameError ? 'failure' : undefined}
                      helperText={lastNameError ? <span className="text-red-500">{lastNameError}</span> : undefined}
                    />
                  </div>
                  <div>
                    <div className="mb-2 block">
                      <Label htmlFor="country" value="Country" />
                    </div>
                    <Select
                        onChange={() => setChanged(true)}
                        id="country"
                        name="country"
                        defaultValue={data.country || ""}
                      >
                        <option value="" disabled>
                          Select a country
                        </option>
                        {getData().map((country) => (
                          <option key={country.code} value={country.name}>
                            {country.name}
                          </option>
                        ))}
                      </Select>
                  </div>
                  <div>
                    <div className="mb-2 block">
                      <Label htmlFor="phone" value="Phone Number" />
                    </div>
                    <TextInput
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+112345678"
                      maxLength={20}
                      defaultValue={data.phone}
                      shadow={true}
                      theme={inputTheme}
                      color={phoneError ? 'failure' : undefined}
                      helperText={phoneError ? <span className="text-red-500">{phoneError}</span> : undefined}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={changedLoading || !changed}
                  className={`mt-5 bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-800 ${
                    loading ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  {changedLoading ? (
                    <div className="flex items-center">
                      <Spinner
                        aria-label="Spinner button example"
                        size="sm"
                        theme={spinnerTheme}
                      />
                      <span className="pl-3">Loading...</span>
                    </div>
                  ) : (
                    "Save all"
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

export default UserProfilePage;