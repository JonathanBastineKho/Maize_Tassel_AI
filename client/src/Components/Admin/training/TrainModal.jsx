import { Modal, Label, TextInput, Select, Table, Button, Checkbox } from "flowbite-react";
import { inputTheme, selectTheme } from "../../theme";
import { useState, useEffect, useCallback, useMemo } from "react";
import { HiSearch, HiCheck, HiExclamation } from "react-icons/hi";
import axios from "axios";
import InfiniteScroll from "react-infinite-scroll-component";
import ToastMsg from "../../Other/ToastMsg";

function TrainModal({ open, setOpen, models, setSuccessTrainToastOpen }) {
  const [epoch, setEpoch] = useState(100);
  const [patience, setPatience] = useState(10);
  const [dropout, setDropout] = useState(0.1);
  const [lr, setLr] = useState(0.001);
  const [freeze, setFreeze] = useState(10);
  const [baseModelVersion, setBaseModelVersion] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [errorToastOpen, setErrorToastOpen] = useState(false);
  const isAnyDatasetSelected = useMemo(() => {
    return datasets.some(dataset => dataset.checked);
  }, [datasets]);

  const validateNumber = (value, min, max) => {
    const num = parseFloat(value);
    if (isNaN(num)) return min;
    return Math.min(Math.max(num, min), max);
  };

  const fetch = useCallback(() => {
    axios
      .get(
        `/api/maintenance/search-dataset?dataset=${encodeURIComponent(
          debouncedSearch
        )}&page=${page}&page_size=20`
      )
      .then((res) => {
        if (res.status === 200) {
            const newDatasets = res.data.dataset.map(dataset => ({
                ...dataset,
                checked: false
            }));
          if (page === 1) {
            setDatasets(newDatasets);
          } else {
            setDatasets((prev) => [...prev, ...newDatasets]);
          }
          setPage((prevPage) => prevPage + 1);
          setHasMore(res.data.dataset.length === 20);
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
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
  }, [debouncedSearch, open]);

  useEffect(() => {
    if (open && page === 1) {
      fetch();
    }
  }, [open, page, debouncedSearch, fetch]);

  const handleTrain = () => {
    setBtnLoading(true);
    const selectedDatasets = datasets.filter(dataset => dataset.checked).map(dataset => dataset.name);

    const trainParams = {
      dataset_names: selectedDatasets,
      base_model_version: baseModelVersion,
      epochs: parseInt(epoch),
      patience: parseInt(patience),
      dropout: parseFloat(dropout),
      learning_rate: parseFloat(lr),
      freeze_layers: parseInt(freeze),
    };

    axios.post("/api/maintenance/train-model", trainParams)
    .then((res) => {
      if (res.status === 200) {
        setOpen(false);
        setSuccessTrainToastOpen(true);
      }
    })
    .catch((err) => {
      if (err.response.status === 400) {
        setErrorToastOpen(true);
      } else if (err.response.status === 401){
        navigate("/login");
      }
    })
    .finally(() => setBtnLoading(false));
  }

  return (
    <>
    <Modal show={open} onClose={() => setOpen(false)}>
      <ToastMsg color="red" icon={<HiExclamation className="h-5 w-5" />} open={errorToastOpen} setOpen={setErrorToastOpen} message="No images in the selected datasets" />
      <Modal.Header>Train Model</Modal.Header>
      <Modal.Body>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="mb-2 block">
              <Label htmlFor="epoch" value="Num of Epoch" />
            </div>
            <TextInput
              theme={inputTheme}
              value={epoch}
              onChange={(e) => {
                const newEpoch = validateNumber(e.target.value, 1, 300);
                setEpoch(newEpoch);
                setPatience(prevPatience => Math.min(prevPatience, newEpoch));
              }}
              id="epoch"
              type="number"
              min={1}
              max={300}
              placeholder="Number of Epoch"
              required
            />
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="patience" value="Patience" />
            </div>
            <TextInput
              theme={inputTheme}
              value={patience}
              onChange={(e) => {validateNumber(e.target.value, 0, epoch)}}
              id="patience"
              type="number"
              min={0}
              max={epoch}
              placeholder="Patience"
              required
            />
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="dropout" value="Dropout" />
            </div>
            <TextInput
              theme={inputTheme}
              value={dropout}
              onChange={(e) => {setDropout(validateNumber(e.target.value, 0, 0.9))}}
              id="dropout"
              type="number"
              min={0}
              step={0.1}
              max={0.9}
              placeholder="Dropout"
              required
            />
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="lr" value="Learning rate" />
            </div>
            <TextInput
              theme={inputTheme}
              value={lr}
              onChange={(e) => setLr(validateNumber(e.target.value, 0.00001, 1))}
              id="lr"
              type="number"
              min={0.00001}
              step={0.00001}
              max={1}
              placeholder="Learning rate"
              required
            />
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="freeze" value="Freeze Layer" />
            </div>
            <TextInput
              theme={inputTheme}
              value={freeze}
              onChange={(e) => {setFreeze(validateNumber(e.target.value, 8, 30))}}
              id="freeze"
              type="number"
              min={8}
              max={30}
              placeholder="Freeze Layer"
              required
            />
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="version" value="Base Model Version" />
            </div>
            <Select 
              color="green" 
              theme={selectTheme} 
              id="version" 
              required
              value={baseModelVersion}
              onChange={(e) => setBaseModelVersion(parseInt(e.target.value))}
            >
              {models !== null &&
                models
                .filter(model => model.finish_train_date !== null)
                .map((model, idx) => (
                  <option key={model.version} value={model.version}>
                    Version {model.version}
                  </option>
                ))}
            </Select>
          </div>
        </div>
        <div className="mt-3 mb-3">
            <Label>Select Dataset</Label>
        </div>
        <div>
          <TextInput
            value={search}
            onChange={(e) => {setSearch(e.target.value)}}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                  setDebouncedSearch(search);
              }
            }}
            theme={inputTheme}
            icon={HiSearch}
            placeholder="Search dataset"
          />
          <div className="my-5 max-h-56 overflow-auto">
            {loading ? (
              <div className="w-full text-center">
                <Label className="text-gray-500">Loading</Label>
              </div>
            ) : (
              <InfiniteScroll
                dataLength={datasets.length}
                next={fetch}
                hasMore={hasMore}
                loader={
                  <div className="mt-8 flex items-center justify-center">
                    <Label className="text-gray-500">Loading...</Label>
                  </div>
                }
              >
                <Table hoverable>
                  <Table.Body>
                    {datasets.map((dataset, idx) => (
                      <Table.Row
                        key={idx}
                        onClick={() => {
                        setDatasets(prevDatasets => 
                            prevDatasets.map((dataset, index) => 
                                idx === index ? { ...dataset, checked: !dataset.checked } : dataset
                            )
                            );
                        }}
                      >
                        <Table.Cell className="flex flex-row justify-between items-center">
                          <Label htmlFor={idx} className="tex-sm">
                            {dataset.name}
                          </Label>
                          {dataset.checked && (
                            <HiCheck className="text-green-500" size={20} />
                          )}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </InfiniteScroll>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={handleTrain} disabled={!isAnyDatasetSelected||btnLoading} className="bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-600">Train</Button>
            <Button onClick={() => {setOpen(false)}} color="light" className="focus:ring-green-300">Cancel</Button>
        </div>
      </Modal.Body>
    </Modal>
    </>
  );
}

export default TrainModal;