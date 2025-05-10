# import requests
# import json
#
# def test_csv_operations():
#     base_url = "http://localhost:18080"
#     test_file = "path/to/sample.csv"
#
#     # Test regular sum
#     response = requests.post(f"{base_url}/csv/sum",
#                              json={"file": test_file, "column": 0})
#     print(f"Regular sum: {response.json()}")
#
#     # Test encrypted sum
#     response = requests.post(f"{base_url}/csv/sum",
#                              json={"file": test_file, "column": 0, "encrypted": True})
#     print(f"Encrypted sum: {response.json()}")
#
#     # Test average
#     response = requests.post(f"{base_url}/csv/average",
#                              json={"file": test_file, "column": 0})
#     print(f"Average: {response.json()}")
#
# if __name__ == "__main__":
#     test_csv_operations()